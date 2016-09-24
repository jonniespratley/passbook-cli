'use strict';
const fs = require('fs-extra');
const _ = require('lodash');
const assert = require('assert');
const path = require('path');
const mocks = require(path.resolve(__dirname, './mocks'));
const program = mocks.program;

var options = mocks.mockIdentifer;
options.tempDir = path.resolve(__dirname, './temp');

var signpass;
var mockPass = mocks.mockPass;
var passes = mocks.mockPasses;
var mockIdentifer = mocks.mockIdentifer;

var mockPasses;
var _passes = [];
var _mockPassFilenames = [];
var _mockPkpassFilenames = [];
var _mockPkpassFilename;
const SignPass = require(path.resolve(__dirname, '../src/signpass'));

/*global describe, it, before*/
describe('SignPass', function() {

  //this.timeout(25000);
  xdescribe('jps-passbook', function() {
    before('should be defined', function(done) {
      program.db.bulkDocs(mocks.mockPasses).then(function(resp) {
        mockPasses = resp;
        done();
      }).catch((err) => {
        done(err);
      });
    });

    it(
      'savePassTypeIdentifier() - should create pass certs and save passTypeIdentifier to database successfully.',
      function(done) {
        jpsPassbook.savePassTypeIdentifierPromise(mockIdentifer).then(function(p) {
          assert(p);
          done();
        }).catch(function(err) {
          assert.fail(err);
          done();
        });
      });

    it('savePassTypeIdentifier() - should should fail when no p12 present.', function(done) {
      jpsPassbook.savePassTypeIdentifierPromise({
        passphrase: 'test',
        passTypeIdentifier: 'test'
      }).then(function(p) {
        assert.fail(p);
        done();
      }).catch(function(err) {
        assert(err);
        done();
      });
    });

    it('savePassTypeIdentifier() - should should fail when no passphrase present.', function(done) {
      jpsPassbook.savePassTypeIdentifierPromise({
        passTypeIdentifier: 'test'
      }).then(function(p) {
        assert.fail(p);
        done();
      }).catch(function(err) {
        assert(err);
        done();
      });
    });

    it('getPassCerts() - should get pass certs from database successfully.', function(done) {
      jpsPassbook.getPassCerts(mockPass.passTypeIdentifier, function(err, p) {
        if (err) {
          assert.fail(err);
        }
        assert.ok(p);
        done();
      });
    });

    it('getPassCerts() - should get pass certs from database fail.', function(done) {
      jpsPassbook.getPassCerts('unknown-id', function(err, p) {
        assert(err);
        done();
      });
    });
    it('jpsPassbook.getPassCerts - should be fetch pass type info', function(done) {
      jpsPassbook.getPassCerts(mocks.mockIdentifer.passTypeIdentifier, function(err, resp) {
        console.log('pass certs', resp);
        options = resp;
        if (err) {
          assert.fail(err);
          done();
        }
        assert(options);
        assert(fs.existsSync(resp.key));
        assert(fs.existsSync(resp.p12));
        assert(fs.existsSync(resp.wwdr));
        assert(fs.existsSync(resp.cert));
        done();
      });
    });
    it('create pass', function(done) {
      jpsPassbook.createPassPromise(mockPasses[2]).then(function(resp) {
        mockPass = resp;
        //	mockPass = resp[0];
        //	console.log('Using Mock Pass', mockPass);
        done();
      });
    });
  });

  it('should be defined', function(done) {
    assert(SignPass);
    done();
  });

  it('should create SignPass instance', function(done) {
    signpass = new SignPass(options);
    assert(signpass);
    done();
  });


  describe('Certs', function() {

    it('should return PassTypeId object', function(done) {
      options = SignPass.createPassTypeId(mocks.mockIdentifer.passTypeIdentifier, mocks.mockIdentifer);
      console.log('pass type id', options);
      assert(options);
      done();
    });

    it('createPems() - should create -cert.pem and -key.pem files from a .p12 certficate.', function(done) {
      mocks.mockIdentifer.output = mocks.config.dataPath;
      SignPass.createPems(mocks.mockIdentifer, function(err, resp) {
        options = resp;
        if (err) {
          assert.fail(err);
          done();
        }

        assert(fs.existsSync(resp.key));
        assert(fs.existsSync(resp.p12));
        assert(fs.existsSync(resp.wwdr));
        assert(fs.existsSync(resp.cert));
        done();
      });
    });

    xit('find all passes', function(done) {
      program.db.find({
        docType: 'pass'
      }).then(function(resp) {
        _passes = resp;
        jpsPassbook.batchCreatePasses(_passes).then(function(r) {
          mockPass = r[1];
          console.log('Created passes', r);
          //console.log('Using Mock Pass', mockPass);
          _mockPassFilenames = _.map(r, 'filename');
          console.log('_mockPassFilenames', _mockPassFilenames);
          done();
        });
      });
    });
  });


  xdescribe('Siging', function() {

    it('sign() - should create .zip and .pkpass files', function(done) {
      options.passFilename = mockPass.rawFilename;
      //options.tempDir = path.resolve(__dirname, '../tmp');
      signpass = new SignPass(options);
      signpass.sign(function(err, resp) {
        console.log('\n\n Signed using', options.passFilename);
        mockPass.pkpassFilename = resp.dest;
        if (err) {
          assert.fail(err);
          done();
        }
        assert(resp);
        assert(fs.existsSync(resp.dest));
        done();
      });
    });

    it('validate - should validate pass with signpass bin and resolve on success', function(done) {
      SignPass.validate(mockPass.pkpassFilename).then(function(resp) {
        assert(resp);
        done();
      }).catch(function(err) {
        done(err);
      });
    });

    describe('Batching', function() {

      it('sign() - all passes - should create .zip and .pkpass for each pass type', function(done) {
        this.timeout(10000);

        var _done = _.after(_mockPassFilenames.length, function() {
          done();
        });

        _.forEach(_mockPassFilenames, function(filename) {
          //					filename = filename.replace('.raw', '.pkpass');
          console.log('Sign', filename);
          options.passFilename = filename;
          signpass = new SignPass(options);
          signpass.sign(function(err, resp) {
            if (err) {
              assert.fail(err);
              done();
            }
            _mockPkpassFilenames.push(resp.dest);
            _mockPkpassFilename = resp.dest;
            assert(resp.dest);
            assert(fs.existsSync(resp.dest));
            _done(resp);
          });
        });
      });

      describe('Validation', function() {

        it('validate - should validate pass with signpass bin and reject on error', function(done) {
          SignPass.validate('invalid-pkpass').then(function(resp) {
            assert.fail(resp);
            done();
          }).catch(function(err) {
            assert(err);
            done();
          });
        });

        it('validate - all signed passes must be valid', function(done) {
          var _done = _.after(_mockPkpassFilenames.length, function() {
            done();
          });
          _.forEach(_mockPkpassFilenames, function(filename) {
            assert(filename);
            SignPass.validate(filename).then(function(_resp) {
              assert(_resp);
              _done();
            }).catch(function(err) {
              assert.fail(err);
              done(err);
            });
          });
        });
      });
    });

  });


});
