'use strict';
const request = require('request');
const fs = require('fs-extra');
const async = require('async');
const path = require('path');
const crypto = require('crypto');
const pkg = require(path.resolve(__dirname, '../package.json'));
const log = require('npmlog');
const debug = require('debug');
const logger = debug(`${pkg.name}:utils`);

const shell = require('pshell').context({
  echoCommand: false,
  ignoreError: false,
  captureOutput: false
});

class Utils {
  constructor() {}
  exec(cmd, options) {
    return shell(cmd, options);
  }
  checksum(str, algorithm, encoding) {
    return crypto
      .createHash(algorithm || 'md5')
      .update(str, 'utf8')
      .digest(encoding || 'hex')
  }
  getLogger(name) {
      return debug(pkg.name + ':' + name);
    }
    /**
     * Copy pass assets from ./templates dir to pass destination.
     * @param type
     * @param dest
     */
  createPassAssets(name, passType, dest, passObj) {
    return new Promise((resolve, reject) => {
      let destDir = path.resolve(dest, `./${name}.raw/`);
      let templatesDir = path.resolve(__dirname, `./templates/${passType}.raw/`);
      let passTypeIdentifier = process.env.PASS_TYPE_IDENTIFIER;
      let teamIdentifier = process.env.TEAM_IDENTIFIER;
      var passJson = fs.readJsonSync(`${templatesDir}/pass.json`);
      if (passTypeIdentifier) {
        log.info('using', passTypeIdentifier);
        passJson.passTypeIdentifier = passTypeIdentifier;
      }
      passJson.teamIdentifier = teamIdentifier;

      //log.info('pass.json', passJson);
      logger('createPassAssets', 'from', templatesDir);
      logger('createPassAssets', 'to', destDir);
      try {

        fs.ensureDirSync(destDir);
        fs.copySync(templatesDir, destDir);

        fs.outputJsonSync(`${destDir}/pass.json`, passJson);
        fs.removeSync(`${destDir}/.DS_Store`);
        resolve(destDir);
      } catch (e) {
        reject(e);
      }
    });
  }

  getPkcs12CertCmd(p12, passphrase) {
    let _path = path.parse(p12);
    logger('getPkcs12CertCmd', p12);
    _path.ext = '.pem';
    _path.name += '-cert';
    let _out = p12.replace('.p12', '-cert.pem');
    let _cmd =
      `openssl pkcs12 \
      -in ${p12} \
      -passin pass:${passphrase} \
      -clcerts \
      -nokeys \
      -out ${_out}`;
    logger('getPkcs12CertCmd', _cmd);
    return {
      filename: _out,
      cmd: _cmd
    };
  }

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

  createPemFiles(p12, passphrase, dest) {
    if (!dest) {
      dest = path.resolve(p12);
    }
    return new Promise((resolve, reject) => {
      let key = this.getPkcs12KeyCmd(p12, passphrase);
      let cert = this.getPkcs12CertCmd(p12, passphrase);
      Promise.all([
        this.exec(key.cmd),
        this.exec(cert.cmd)
      ]).then((res) => {
        //fs.copySync(resp[0].filename, dest);
        //fs.copySync(resp[1].filename, dest);
        //  log.info('done', res);
        resolve([
          key, cert
        ]);
      }).catch(reject);

    });
  }

  /**
   * Validate the contents of a .pkpass package.
   * @param {String} pkpassFilename The filename of the pass.
   */
  validatePkpass(pkpassFilename) {
    assert(pkpassFilename, 'has pkpass filename');
    let bin = path.resolve(__dirname, './bin/signpass');
    let regex = /(FAILED)/gmi;
    log.info('validate', pkpassFilename);
    return new Promise((resolve, reject) => {
      shell(`${bin} -v ${pkpassFilename}`, {
        captureOutput: (buf) => {
          return buf.toString();
        }
      }).then((resp) => {
        log.info('resp', resp);
        if (regex.test(resp.stdout)) {
          log.error('err', resp);
          reject(new Error(resp.stdout));
        } else {
          resolve(resp.stdout);
        }
      }).catch((err) => {
        log.error('err', err);
        reject(err);
      });
    });
  };
}


module.exports = new Utils();
