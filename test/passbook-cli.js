/* global describe, it */
'use strict';

var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
var exec = require('child_process').exec;
var path = require('path');
var config = require('./test-config');

var passTypes = ['coupon', 'generic', 'eventTicket', 'boardingPass', 'storeCard'];
var output = path.resolve(__dirname, './temp/passes');


xdescribe('passbook-cli bin', function () {
  var cmd = 'node ' + path.join(__dirname, '../bin/passbook-cli') + ' ';

  it('--help should run without errors', function (done) {
    exec(cmd + '--help', function (error, stdout, stderr) {
      assert(!error);
      done();
    });
  });

  it('--version should run without errors', function (done) {
    exec(cmd + '--version', function (error, stdout, stderr) {
      assert(!error);
      done();
    });
  });

  it('should return error on missing command', function (done) {
    this.timeout(4000);

    exec(cmd, function (error, stdout, stderr) {
      assert(error);
      assert.equal(error.code, 1);
      done();
    });
  });

  it('should return error on unknown command', function (done) {
    this.timeout(4000);

    exec(cmd + 'junkcmd', function (error, stdout, stderr) {
      assert(error);
      assert.equal(error.code, 1);
      done();
    });
  });

  describe('create-pems', () => {
    it('--help should run without errors', function (done) {
      exec(cmd + 'create-pems --help', function (error, stdout, stderr) {
        assert(!error);
        done();
      });
    });
    it('should run without errors', function (done) {
      let str = `--input=${config.certs.p12} --output=./temp --passphrase=${config.certs.passphrase}`;
      exec(cmd + 'create-pems ' + str, function (error, stdout, stderr) {
        assert(!error);
        done();
      });
    });
  });

  describe('create-pass', () => {
    it('--help should run without errors', function (done) {
      exec(cmd + 'create-pass --help', function (error, stdout, stderr) {
        assert(!error);
        done();
      });
    });

    context('--type', function(){

        passTypes.forEach(function(type){
            it(`${type} - should run without errors`, function(done){
                var str = `--name=test-${type}-pass \
        	               --type=${type} \
        	               --output=${output}`;
                var filename;
              exec(cmd + 'create-pass ' + str, function (error, stdout, stderr) {
                  filename = _.trim(path.resolve(stdout.substr(2, stdout.length), './'));
                  console.log(stdout, filename);

                  assert(fs.existsSync(filename), '.raw package should exist')
                assert(!error);
                done();
              });
            });
        })
    });
  });
});
