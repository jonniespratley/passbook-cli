'use strict';
const fs = require('fs');
const glob = require('glob');
const _ = require('lodash');
const path = require('path');
const assert = require('assert');
const utils = require('../src/utils');
const tempDir = path.resolve(__dirname, './temp');
const pem = require('pem');
const config = require('./test-config');
const Chance = require('chance');
const chance = new Chance();
var rawpassFilename;
describe('Utils', () => {
  it('getLogger - returns log instance', (done) => {
    var logger = utils.getLogger('test');
    assert(logger);
    logger('spec');
    done();
  });

  it('checksum - returns checksum', (done) => {
    var str = utils.checksum('test');
    assert(str);
    done();
  });

  it('exec - executes command and returns promise', (done) => {
    utils.exec('node --version').then((resp) => {
      assert(resp);
      done();
    });
  });

  context('Certificates', () => {
    var cmds = [];
    it('getPkcs12CertCmd - returns filename and command', (done) => {
      var str = utils.getPkcs12CertCmd(config.certs.p12, 'test', tempDir);
      assert(str);
      cmds.push(str);
      done();
    });

    it('getPkcs12KeyCmd - returns filename and command', (done) => {
      var str = utils.getPkcs12KeyCmd(config.certs.p12, 'test', tempDir);
      assert(str);
      cmds.push(str);

      done();
    });

    it('createPemFiles - create cert.pem, key.pem and resolve on success', (done) => {
      utils.createPemFiles(config.certs.p12, config.certs.passphrase, tempDir).then((res) => {
        config.certs.cert = res.cert;
        config.certs.key = res.key;
        assert(res);
        done();
      }).catch((err) => {
        done(err);
      });
    });

    xit('should execute cert command', (done) => {
      let _done = _.after(cmds.length, () => {
        done();
      });
      _.forEach(cmds, (cmd) => {
        assert(cmd);
        utils.exec(cmd.cmd).then((resp) => {
          assert(resp);
          assert(fs.existsSync(cmd.filename), 'creates filename');
          _done();
        }).catch((err) => {
          done(err);
        });
      });
    });

  });

  context('Passes', () => {
    it('createPassAssets - should create .raw pass files to dest and resolve', (done) => {
      utils.createPassAssets({
        name: 'test-pass-1',
        type: 'generic',
        output: './temp'
      }).then((resp) => {
        assert(resp);
        done();
      }).catch((err) => {
        assert.fail(err);
        done();
      });
    });

    it('createPassAssets - should create .raw pass files, extended with passes obj and resolve', (done) => {
      utils.createPassAssets({
        name: 'test-pass-2',
        type: 'generic',
        teamIdentifier: config.teamIdentifier,
        passTypeIdentifier: config.passTypeIdentifier,
        output: './temp'
      }).then((resp) => {
        let pass = JSON.parse(fs.readFileSync(`${resp}/pass.json`));
        rawpassFilename = resp;
        assert(resp);
        assert(fs.existsSync(resp));
        assert(pass.teamIdentifier === config.teamIdentifier);
        assert(pass.passTypeIdentifier === config.passTypeIdentifier);
        done();
      }).catch((err) => {
        console.log('err', err);
        assert.fail(err);
        done();
      });
    });

    it('generateJsonManifest - should generate a manifest.json of the .raw package and resolve on success', (done) => {
      utils.generateJsonManifest(rawpassFilename).then((resp) => {
        assert(resp);
        done();
      }).catch((err) => {
        assert.fail(err);
        done();
      });
    });

    it('signJsonManifest - should sign a manifest.json of the .raw package and resolve on success', (done) => {
      utils.signJsonManifest(rawpassFilename, config.certs.cert.filename, config.certs.key.filename,
        config.certs.passphrase).then((resp) => {
        assert(resp);
        done();
      }).catch((err) => {
        assert.fail(err);
        done();
      });
    });

    it('compressRawDirectory - should create a .pkpass package, .zip package from a .raw package', (done) => {
      utils.compressRawDirectory(rawpassFilename).then((resp) => {
        assert(resp);
        console.log(resp);
        done();
      }).catch((err) => {
        assert.fail(err);
        done();
      });
    });

    it('createPkPass - should generateJsonManifest, signJsonManifest, and compressRawDirectory for each pass type', (done) => {
      utils.createPkPass(rawpassFilename, config.certs.cert.filename, config.certs.key.filename, config.certs.passphrase).then((resp) => {
        assert(resp);
        done();
      }).catch((err) => {
        assert.fail(err);
        done();
      });
    });


    it('validatePkpass - should validate a .pkpass package and resolve on success', (done) => {
      done();
    });

    context('Types', () => {
      var passTypes = ['coupon', 'generic', 'eventTicket', 'storeCard'/*, 'boardingPass'*/];

      passTypes.forEach((type) => {
        it(`should create pass for ${type}`, (done) => {
          let serial = chance.guid();
          var options = {
            name: `test-${type}`,
            type: type,
            webServiceURL: config.webServiceURL,
            teamIdentifier: config.teamIdentifier,
            serialNumber: serial,
            authenticationToken: chance.apple_token(),
            passTypeIdentifier: config.passTypeIdentifier,
            _id: String(config.passTypeIdentifier + '-' + serial).replace(/\W/g, '-'),
            output: path.resolve(__dirname, './temp')
          };
          utils.createPassAssets(options).then((resp) => {
              console.log(resp);
              assert(fs.existsSync(resp));
              utils.createPkPass(resp, config.certs.cert.filename, config.certs.key.filename, config.certs.passphrase).then((pkpass) => {
                 console.log(pkpass);
                assert(fs.existsSync(pkpass));
                done();
              }).catch((err) => {
                assert.fail(err);
                done();
              });
            })
            .catch((err) => {
              assert.fail(err);
              done();
            });
        });
      });
    });

  });
});
