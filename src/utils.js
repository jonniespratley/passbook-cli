'use strict';
const assert = require('assert');
const async = require('async');
const crypto = require('crypto');
const debug = require('debug');
const fs = require('fs-extra');
const glob = require('glob');
const request = require('request');

const path = require('path');

const pkg = require(path.resolve(__dirname, '../package.json'));
const log = require('npmlog');
const logger = debug(`${pkg.name}:utils`);

const zip = new require('node-zip')();
const shell = require('pshell').context({
  echoCommand: false,
  ignoreError: false,
  captureOutput: false
});


/**
 * @class Utils
 * @module utils
 * @description Utility methods used by passbook-cli.
 */
class Utils {
  constructor() {}

  /**
   * exec - description
   *
   * @param  {type} cmd     description
   * @param  {type} options description
   * @return {type}         description
   */
  exec(cmd, options) {
    return shell(cmd, options);
  }

  /**
   * checksum - description
   *
   * @param  {type} str       description
   * @param  {type} algorithm description
   * @param  {type} encoding  description
   * @return {type}           description
   */
  checksum(str, algorithm, encoding) {
    return crypto
      .createHash(algorithm || 'md5')
      .update(str, 'utf8')
      .digest(encoding || 'hex');
  }

  /**
   * getLogger - description
   *
   * @param  {type} name description
   * @return {type}      description
   */
  getLogger(name) {
    return debug(pkg.name + ':' + name);
  }

  /**
   * createPassAssets - Copy pass assets from ./templates dir to pass destination.
   *
   * @param  {Object} obj Options object
   * @param  {String} obj.name name of the pass
   * @param  {String} obj.type type of pass
   * @param  {String} obj.dest output path
   * @param  {String} obj.passTypeIdentifier pass type identifier to use
   * @param  {String} obj.teamIdentifier team identifier to use
   * @param  {String} obj.pass pass object to mixin with defaults
   * @return {String} path The path of the output
   */
  createPassAssets(obj) {
    return new Promise((resolve, reject) => {
      let name = obj.name;
      let passType = obj.type;
      let dest = obj.output;
      let passObj = obj.pass || {};

      let destDir = path.resolve(dest, `./${name}.raw/`);
      let templatesDir = path.resolve(__dirname, `./templates/${passType}.raw/`);
      let passTypeIdentifier = obj.passTypeIdentifier || process.env.PASS_TYPE_IDENTIFIER;
      let teamIdentifier = obj.teamIdentifier || process.env.TEAM_IDENTIFIER;
      var passJson = fs.readJsonSync(`${templatesDir}/pass.json`);
      passObj = Object.assign(passJson, passObj);
      if (passTypeIdentifier) {
        logger('using', passTypeIdentifier);
        passJson.passTypeIdentifier = passTypeIdentifier;
      }
      if (teamIdentifier) {
        logger('using', teamIdentifier);
        passJson.teamIdentifier = teamIdentifier;
      }

      //log.info('pass.json', passJson);
      logger('createPassAssets', 'from', templatesDir);
      logger('createPassAssets', 'to', destDir);
      try {
        fs.ensureDirSync(destDir);
        fs.copySync(templatesDir, destDir);
        fs.outputJsonSync(`${destDir}/pass.json`, passObj);
        fs.removeSync(`${destDir}/.DS_Store`);
        resolve(destDir);
      } catch (e) {
        logger('createPassAssets', e);
        reject(e);
      }
    });
  }

  /**
   * getPkcs12CertCmd - Creates the command needed to generate a certificate.pem
   *
   * @param  {String} p12           path to the .p12 cert
   * @param  {String} passphrase    passphrase for .p12 cert
   * @return {Object} cmd         the command and filename
   */
  getPkcs12CertCmd(p12, passphrase) {
    let _path = path.parse(p12);
    logger('getPkcs12CertCmd', p12);
    _path.ext = '.pem';
    _path.name += '-cert';
    p12 = path.resolve(p12);
    let _out = p12.replace('.p12', '-cert.pem');
    let _cmd = `openssl pkcs12 -in ${p12} -passin pass:${passphrase} -clcerts -nokeys -out ${_out}`;
    logger('getPkcs12CertCmd', _cmd);
    return {
      filename: _out,
      cmd: _cmd
    };
  }


  /**
   * getPkcs12KeyCmd - Creates the command needed to generate a key.pem
   *
   * @param  {String} p12           path to the .p12 cert
   * @param  {String} passphrase    passphrase for .p12 key
   * @return {Object} cmd           the command and filename
   */
  getPkcs12KeyCmd(p12, passphrase) {
    let _path = path.parse(p12);
    _path.ext = '.pem';
    _path.name += '-key';
    p12 = path.resolve(p12);
    logger('getPkcs12KeyCmd', p12);
    let _out = p12.replace('.p12', '-key.pem');
    let _cmd =
      `openssl pkcs12 -in ${p12} -nocerts -passout pass:${passphrase} -passin pass:${passphrase} -out ${_out}`;
    logger('getPkcs12KeyCmd', _cmd);
    return {
      filename: _out,
      cmd: _cmd
    };
  }

  /**
   * createPemFiles - Creates the required key/cert for signing a .raw package into a .pkpass
   *
   * @param  {type} p12        The path to the .p12 cert
   * @param  {type} passphrase The passphrase for the cert
   * @param  {type} dest       The output destination (default is .p12 dir)
   * @return {type}            description
   */
  createPemFiles(p12, passphrase) {

    return new Promise((resolve, reject) => {
      let key = this.getPkcs12KeyCmd(p12, passphrase);
      let cert = this.getPkcs12CertCmd(p12, passphrase);
      Promise.all([
        this.exec(key.cmd),
        this.exec(cert.cmd)
      ]).then((res) => {
        resolve({
          key,
          cert
        });
      }).catch(reject);

    });
  }


  /**
   * validatePkpass - Validate the contents of a .pkpass package.
   *
   * @param  {String} pkpassFilename The path to the .pkpass package
   * @return {String}                description
   */
  validatePkpass(pkpassFilename) {
    assert(pkpassFilename, 'has pkpass filename');
    let bin = path.resolve(__dirname, './bin/signpass');
    let regex = /(FAILED)/gmi;
    logger('validate', pkpassFilename);
    return new Promise((resolve, reject) => {
      shell(`${bin} -v ${pkpassFilename}`, {
        captureOutput: (buf) => {
          return buf.toString();
        }
      }).then((resp) => {
        logger('resp', resp);
        if (regex.test(resp.stdout)) {
          logger('err', resp);
          reject(new Error(resp.stdout));
        } else {
          resolve(resp.stdout);
        }
      }).catch((err) => {
        logger('err', err);
        reject(err);
      });
    });
  }


  /**
   * generateJsonManifest - Creates a .json manifest of the .raw package files.
   *
   * @param  {String} rawpassFilename The path to the .raw package
   * @return {String} manifest
   */
  generateJsonManifest(rawpassFilename) {
    return new Promise((resolve, reject) => {
      let _manifest = {};
      let _manifestFilename = path.resolve(rawpassFilename, './manifest.json');
      let _filename, _checksum;
      logger('generateJsonManifest', _manifestFilename);
      fs.removeSync(path.resolve(rawpassFilename, './.DS_Store'));
      glob(`${rawpassFilename}/**/*.*`, (err, files) => {
        if (err) {
          reject(err);
        }
        if (files && files.length) {
          files.forEach((file) => {
            logger('Check if file is in manifest', file);
            _filename = file.replace(rawpassFilename + path.sep, '');
            _checksum = this.checksum(fs.readFileSync(file), 'sha1');
            _manifest[_filename] = _checksum;
            logger('checksum', _filename);
          });

          fs.writeFile(_manifestFilename, JSON.stringify(_manifest), (err) => {
            if (err) {
              reject(err);
            }
            logger('generateJsonManifest', 'complete');
            resolve(_manifestFilename);
          });
        }
      });
    });
  }


  /**
   * signJsonManifest - Sign the manifest.json file with signing certificate and key.
   *
   * @param  {String} rawpassFilename The path to .raw package
   * @param  {String} cert            The path to the cert
   * @param  {String} key             The path to the key
   * @param  {String} passphrase      The key passphrase
   * @return {String}               The path of the signature
   */
  signJsonManifest(rawpassFilename, cert, key, passphrase) {
    return new Promise((resolve, reject) => {
      let wwdr = path.resolve(__dirname, './certificates/wwdr-authority.pem');
      let manifest = path.resolve(rawpassFilename, './manifest.json');
      let signature = path.resolve(rawpassFilename, './signature');
      logger('signJsonManifest', signature);
      let cmd =
        `openssl smime -binary \
  				-sign \
  				-certfile ${wwdr} \
  				-signer ${cert} \
  				-inkey ${key} \
  				-in ${manifest} \
  				-out ${signature} \
  				-outform DER \
  				-passin pass:${passphrase}`;

      this.exec(cmd).then((res) => {
        logger('signJsonManifest', res);
        resolve(signature);
      }).catch((error) => {
        log.error('signJsonManifest', error);
        reject(error);
      });
    });
  }
}


module.exports = new Utils();
