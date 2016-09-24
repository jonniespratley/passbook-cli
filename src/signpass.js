'use strict';
const async = require('async');
const assert = require('assert');
const glob = require('glob');
const _ = require('lodash');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const utils = require('./utils');
const zip = new require('node-zip')();
const shell = require('pshell').context({
  echoCommand: false,
  ignoreError: false,
  captureOutput: false
});
const log = require('npmlog');

/**
 * SignPass class
* @example
 var certFilename = path.resolve(__dirname, '../../certificates/pass-cert.pem');
 var key = path.resolve(__dirname, '../../certificates/pass-key.pem');
 var wwdrFilename = path.resolve(__dirname, '../../certificates/wwdr-authority.pem');
 var certPass = 'fred';
 var passFilename = path.resolve(__dirname, '../../data/pass-jonniespratley.json');
 var rawpassFilename = path.resolve(__dirname, '../../data/passes/pass-jonniespratley.raw');
 var pkpassFilename = path.resolve(__dirname, '../../data/passes/pass-jonniespratley.pkpass');
 var outputFilename = path.resolve(__dirname, '../temp/passes/');
 var files = null;


 var options = {
 	passFilename: rawpassFilename,
 	cert: certFilename,
 	passphrase: certPass,
 	key: keyFilename,
 	wwdr: wwdrFilename,
 	outputFilename: tmpdir,
 	compress: true
 };

 signpass = new SignPass(options);
 signpass.sign(function(err, resp) {
	 _done(resp);
 });

 * @param pass_url {String} The url to the .pkpass
 * @param certificate_url {String} The url to the cert
 * @param certificate_password {String} The cert password
 * @param wwdr_certificate  {String} The url to the wwrd cert
 * @param output_url  {String} The output url
 * @param compress_into_zip_file {Boolean} Compress into zip.
 * @constructor
 */
function SignPass(opts /*pass_url, cert_url, cert_password, key, wwdr_cert_path, output_url, compress, tmpdir*/ ) {

  var defaults = {
    passFilename: 'pass.raw',
    cert: 'pass.cert',
    passphrase: null,
    key: null,
    wwdr: null,
    outputFilename: null,
    compress: true,
    force: true,
    tempDir: os.tmpdir()
  };


  var options = _.extend(defaults, opts);
  const baseFilename = path.basename(options.passFilename);
  const logger = utils.getLogger(`SignPass:${baseFilename}`);

  const certificate_url = options.cert;
  const certificate_password = options.passphrase;
  const key_url = options.key;
  const compress_into_zip_file = options.compress;


  logger('SignPass', options);
  //log.info('SignPass', options.passFilename, options.cert);

  let temporary_directory = options.tempDir;

  //	assert(options.passFilename, 'has passFilename');
  temporary_directory += path.resolve(path.sep + _.last(options.passFilename.split('/')));
  fs.ensureDirSync(temporary_directory);


  if (!options.outputFilename) {
    options.outputFilename = path.resolve(path.dirname(options.passFilename));
  }

  const signature_url = path.resolve(temporary_directory, './signature');
  const cert_url = options.cert;
  const cert_password = options.passphrase;

  var pass_url = options.passFilename;
  var output_url = options.outputFilename;
  var zip_url = '';
  var pkpass_url = '';

  const wwdr_certificate = options.wwdr || path.resolve(__dirname, './certificates/wwdr-authority.pem');
  var manifest_url;


  assert(options, 'has options');
  assert(pass_url, 'has pass url');
  assert(cert_url, 'has cert url');
  assert(cert_password, 'has cert password');
  assert(wwdr_certificate, 'has wwdr');

  //	assert(fs.existsSync(cert_url), 'has cert');
  //assert(fs.existsSync(pass_url), 'has pass.raw');
  //	assert(fs.existsSync(wwdr_certificate), 'has WWDR Cert');

  logger('SignPass', 'instance');
  logger('temporary_directory', temporary_directory);
  logger('certificate_url', certificate_url);
  logger('certificate_password', certificate_password);
  logger('wwdr_certificate', wwdr_certificate);
  logger('output_url', output_url);
  logger('compress_into_zip_file', compress_into_zip_file);

  function validate_directory_as_unsigned_raw_pass(cb) {
    let has_manifiest = fs.existsSync(path.resolve(pass_url, './manifest.json'));
    let has_signiture = fs.existsSync(path.resolve(pass_url, './signature'));
    if (options.force) {
      force_clean_raw_pass(cb);
    } else if (has_signiture || has_manifiest) {
      throw new Error('Pass contains artifacts that must be removed!');
    } else {
      if (cb) {
        cb(null, null);
      }
    }
  }

  function force_clean_raw_pass(callback) {
    let manifest_file = path.resolve(pass_url, './manifest.json');
    let signature_file = path.resolve(pass_url, './signature');
    let files = [manifest_file, signature_file];
    let _done = _.after(files.length, function() {
      callback(null, {
        manifest: manifest_file,
        signature: signature_file
      });
    });

    _.forEach(files, function(file) {
      logger('force_clean_raw_pass', 'removing', path.basename(file));
      fs.remove(file, function(err) {
        _done(err);
      });
    });
  }

  function create_temporary_directory(callback) {
    logger('create_temp_dir', temporary_directory);
    fs.ensureDir(path.resolve(temporary_directory), function(err) {
      callback(err, temporary_directory);
    });
  }

  function copy_pass_to_temporary_location(callback) {
    logger('copy_to_temp_dir', temporary_directory);
    fs.ensureDirSync(pass_url);
    fs.copy(path.resolve(pass_url, './'), temporary_directory, function(err) {

      callback(err, pass_url);
    });
  }

  function clean_ds_store_files(callback) {
    logger('clean_ds_store_files');
    let ds_files = path.resolve(temporary_directory, './.DS_Store');
    fs.remove(ds_files, function(err) {
      callback(err, ds_files);
    });
  }

  function generate_json_manifest(callback) {

    let _manifest = {};
    let _manifestFilename = path.resolve(temporary_directory, './manifest.json');
    let _filename, _checksum;
    manifest_url = _manifestFilename;
    logger('generate_json_manifest', _manifestFilename);

    fs.removeSync(path.resolve(temporary_directory, './.DS_Store'));
    glob(temporary_directory + path.sep + '**/*.*', function(err, files) {
      if (err) {
        callback(err, null)
      }

      if (files && files.length) {

        files.forEach(function(file) {

          logger('Check if file is in manifest', file);

          _filename = file.replace(temporary_directory + path.sep, '');
          _checksum = utils.checksum(fs.readFileSync(file), 'sha1');

          _manifest[_filename] = _checksum;

          logger('checksum', _filename);
        });
        fs.writeFile(_manifestFilename, JSON.stringify(_manifest), function(err) {
          logger('generate_json_manifest', 'complete');
          callback(err, _manifestFilename);
        });
      }
    });
  }

  function sign_manifest(cb) {
    let signedContents;
    signature_url = path.resolve(temporary_directory, './signature');
    logger('sign_manifest', signature_url);
    let sign_pass_cmd =
      `openssl smime -binary \
				-sign \
				-certfile ${wwdr_certificate} \
				-signer ${certificate_url} \
				-inkey ${key_url} \
				-in ${manifest_url} \
				-out ${signature_url} \
				-outform DER \
				-passin pass:${certificate_password}`;

    //logger('sign_manifest', sign_pass_cmd);
    shell(sign_pass_cmd).then((res) => {
      logger('sign_manifest', res);
      cb(null, signature_url);
    }).catch((error) => {
      log.error('sign_manifest', error);
      cb(error, null);
    });

  }

  function compress_pass_file(callback) {

    let filename = temporary_directory.replace('.raw', '.zip');
    let zip_pass_cmd = `zip -R * ${filename}`;
    logger('compress_pass_file', filename);
    pkpass_url = filename.replace('.zip', '.pkpass');

    fs.removeSync(pkpass_url);
    glob(path.resolve(temporary_directory, './*'), function(err, files) {
      if (err) {
        callback(err, null);
      }

      var done = _.after(files.length, function() {
        let data = zip.generate({
          base64: false,
          compression: 'DEFLATE'
        });
        zip_url = filename;
        fs.writeFileSync(filename, data, 'binary');
        logger('compress_pass_file', 'archive', path.basename(filename));
        callback(null, filename);
      });

      _.forEach(files, function(file) {

        zip.file(path.basename(file), fs.readFileSync(path.resolve(file)));
        logger('compress_pass_file', 'add', path.basename(file));
        done();
      });
    });
  };

  function rename_pass_file(cb) {
    let pkpass_url = zip_url.replace('.zip', '.pkpass');
    logger('rename_pass_file', 'to', pkpass_url);

    try {
      fs.copySync(zip_url, pkpass_url);
      cb(null, pkpass_url);
    } catch (err) {
      cb(err);
    }
  }

  function copy_to_dest(cb) {
    output_url = path.resolve(options.outputFilename, '../', path.basename(pkpass_url));
    try {
      fs.removeSync(output_url);
      fs.copySync(pkpass_url, output_url);
      cb(null, output_url);
    } catch (e) {
      cb(err);
    }
  }

  function delete_temp_dir(cb) {
    logger('delete_temp_dir', temporary_directory);
    try {
      //fs.removeSync(pkpass_url);
      //fs.removeSync(zip_url);
      //fs.removeSync(temporary_directory);
      cb(null, temporary_directory);
    } catch (err) {
      cb(err);
    }
  }

  function sign_pass(cb) {
    logger('sign_pass');
    async.series({
      validate: validate_directory_as_unsigned_raw_pass,
      raw: force_clean_raw_pass,
      tmpdir: create_temporary_directory,
      copy: copy_pass_to_temporary_location,
      clean: clean_ds_store_files,
      manifest: generate_json_manifest,
      signature: sign_manifest,
      zip: compress_pass_file,
      pkpass: rename_pass_file,
      dest: copy_to_dest,
      cleantmpdir: delete_temp_dir
    }, function(err, result) {
      logger('sign_pass', 'complete', result.dest);
      if (err) {
        log.error('sign_pass', err);
        cb(err);
      }
      if (cb) {
        cb(null, result);
      }
    });

  }
  return {
    sign: sign_pass,
    signPromise: function(raw) {
      return new Promise(function(resolve, reject) {
        sign_pass(function(err, resp) {
          if (err) {
            reject(err);
          }
          resolve(resp);
        });
      });
    }
  };
}



SignPass.passTypes = [{
  value: 'generic',
  name: 'Generic'
}, {
  value: 'github',
  name: 'Github'
}, {
  value: 'boardingPass',
  name: 'Boarding Pass'
}, {
  value: 'coupon',
  name: 'Coupon'
}, {
  value: 'eventTicket',
  name: 'Event Ticket'
}, {
  value: 'storeCard',
  name: 'Store Card'
}];


function PassTypeId(id, o) {
  let _id = id.replace(/\W/g, '-');
  return _.assign({
    _id: _id,
    passTypeIdentifier: o.passTypeIdentifier,
    cert: '',
    key: '',
    passphrase: '',
    docType: 'pass-type-id'
  }, o);
}

SignPass.createPassTypeId = function(id, o) {
  return new PassTypeId(id, o);
};

/*
 take a apple .p12 pass cert and make the pems.
 $ openssl pkcs12 -in cert.p12 -clcerts -nokeys -out certificate.pem
 $ openssl pkcs12 -in cert.p12 -nocerts -out key.pem

 @param {String} p12 - The path to the .p12 cert.
 @param {String} pass - The passpharse for the .p12 cert.
*/
SignPass.createPems = function(options, callback) {
  let _options = {
    passphrase: null,
    passTypeIdentifier: null,
    p12: null,
    output: null
  };
  _.assign(_options, options);

  assert(_options.passTypeIdentifier, 'has passTypeIdentifier');
  //assert(_options.pass, 'has pass');
  assert(_options.passphrase, 'has passphrase');
  assert(fs.existsSync(_options.p12), 'has p12');

  let passTypeIdentifier = _options.passTypeIdentifier;
  let passTypeIdentifierFilename = passTypeIdentifier.replace(/\W/g, '-');
  let p12 = _options.p12;
  let passphrase = _options.passphrase;
  let certOutputPath = path.resolve(_options.output, './', passTypeIdentifier, './certs');
  fs.ensureDirSync(certOutputPath);
  let _out = [],
    cmd1 = {},
    cmd2 = {},
    _p12,
    _outCert,
    _cmd1,
    _cmd2,
    _outKey,
    _path = path.parse(p12);

  function _checkCert(cb) {
    fs.exists(p12, function(err) {
      cb(err, p12);
    });
  }

  function _copyP12(cb) {
    _p12 = path.resolve(certOutputPath, './', path.basename(p12));
    fs.removeSync(_p12);
    fs.copy(path.resolve(p12), _p12, function(err) {
      p12 = _p12;
      cb(err, _p12);
    });
  }

  function _certCmd(cb) {
    _path.ext = '.pem';
    _path.name += '-cert';
    _outCert = p12.replace('.p12', '-cert.pem');
    _cmd1 = `openssl pkcs12 -in ${p12} -passin pass:${passphrase} -clcerts -nokeys -out ${_outCert}`;
    fs.removeSync(_outCert);
    console.log(_cmd1);
    cmd1 = {
      filename: _outCert,
      cmd: _cmd1
    };
    cb(null, _outCert);
  }

  function _keyCmd(cb) {
    _path.name += '-key';
    _outKey = p12.replace('.p12', '-key.pem');
    _cmd2 =
      `openssl pkcs12 -in ${p12} -nocerts -passout pass:${passphrase} -passin pass:${passphrase} -out ${_outKey}`;
    fs.removeSync(_outKey);
    console.log(_cmd2);
    cmd2 = {
      filename: _outKey,
      cmd: _cmd2
    };
    cb(null, _outKey);
  }

  function _certCmdExec(cb) {
    shell(cmd1.cmd).then((resp) => {
      cb(null, resp);
    });

    /*child_process.exec(cmd1.cmd, function(err, stdout, stderr) {
    	cb(err, cmd1.cmd);
    });*/
  }

  function _keyCmdExec(cb) {
    shell(cmd2.cmd).then((resp) => {
      cb(null, resp);
    });
    /*child_process.exec(cmd2.cmd, function(err, stdout, stderr) {
    	cb(err, cmd2.cmd);
    });*/
  }

  async.series({
    p12: _copyP12,
    cert: _certCmd,
    key: _keyCmd,
    certcmd: _certCmdExec,
    keycmd: _keyCmdExec
  }, function(err, result) {
    console.log('createPems', err, result);
    let _out = SignPass.createPassTypeId(passTypeIdentifier, result);
    _out.passTypeIdentifier = passTypeIdentifier;
    _out.wwdr = path.resolve(__dirname, './certificates/wwdr-authority.pem');
    _out.p12 = p12;
    _out.passphrase = passphrase;
    if (callback) {
      callback(err, _out);
    }
  });
};

/**
 * Create pems for signing a pass
 * @params {Object} options The options to pass
 */
SignPass.createPemsPromise = function(options) {
  return new Promise(function(resolve, reject) {
    SignPass.createPems(options, function(err, resp) {
      if (err) {
        reject(err);
      }
      resolve(resp);
    });
  });
};

SignPass.validate = function(pkpassFilename) {
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

module.exports = SignPass;
