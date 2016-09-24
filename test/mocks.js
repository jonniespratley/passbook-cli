'use strict';
const path = require('path');

const config = require('./test-config');

exports.config = config;
exports.mockIdentifer = {
  passTypeIdentifier: config.passkit.passTypeIdentifier,
  wwdr: config.certs.wwdr,
  p12: config.certs.p12,
  passphrase: config.certs.passphrase
};
