'use strict';
const request = require('request');
const fs = require('fs-extra');
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
  copyPassAssets(passType, dest) {
    return new Promise((resolve, reject) => {
      let templatesDir = path.resolve(__dirname, `./templates/${passType}.raw/`);
      log.info('copyAssets', 'from', templatesDir);
      log.info('copyAssets', 'to', dest);
      try {
        fs.ensureDirSync(dest);
        fs.copySync(templatesDir, dest);
        resolve(dest);
      } catch (e) {
        reject(e);
      }
    });
  }

  getPkcs12CertCmd(p12, passphrase) {
    let _path = path.parse(p12);
    log.info('getPkcs12CertCmd', p12);
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
    log.info('getPkcs12CertCmd', _cmd);
    return {
      filename: _out,
      cmd: _cmd
    };
  }

  getPkcs12KeyCmd(p12, passphrase, dest) {
    p12 = path.resolve(p12);
    dest = path.resolve(dest, p12);
    log.info('getPkcs12KeyCmd', p12);

    let _path = path.parse(p12);
    _path.ext = '.pem';
    _path.name += '-key';
    let _out = dest.replace('.p12', '-key.pem');
    let _cmd =
      `openssl pkcs12 \
        -in ${p12} \
        -nocerts \
        -passout pass:${passphrase} \
        -passin pass:${passphrase} \
        -out ${_out}`;
    log.info('getPkcs12KeyCmd', _cmd);
    return {
      filename: _out,
      cmd: _cmd
    };
  }

  createPkcs12Files(p12, passphrase, dest) {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.getPkcs12KeyCmd(p12, passphrase, dest),
        this.getPkcs12CertCmd(p12, passphrase, dest)
      ]).then((resp) => {
        Promise.all([
          this.exec(resp[0].cmd),
          this.exec(resp[1].cmd)
        ]).then((res) => {
          //fs.copySync(resp[0].filename, dest);
          //fs.copySync(resp[1].filename, dest);
          log.info('done', res);
          resolve(res);
        }).catch(reject);
      }).catch(reject);
    });
  }
}


module.exports = new Utils();
