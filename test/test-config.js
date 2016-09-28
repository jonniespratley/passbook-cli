'use strict';
const path = require('path');
//TODO - Change to your values
const APPLE_TEAM_IDENTIFIER = process.env.APPLE_TEAM_IDENTIFIER || 'USE9YUYDFH';
const APPLE_PASS_TYPE_IDENTIFIER = process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.io.passbookmanager.test';

const APPLE_WWDR = path.resolve(__dirname, '../src/certificates/wwdr-authority.pem');
const APPLE_PASS_TYPE_IDENTIFIER_CERT = process.env.APPLE_PASS_TYPE_IDENTIFIER_CERT || path.resolve(__dirname,
  `./certs/${APPLE_PASS_TYPE_IDENTIFIER}-cert.pem`);
const APPLE_PASS_TYPE_IDENTIFIER_KEY = process.env.APPLE_PASS_TYPE_IDENTIFIER_KEY || path.resolve(__dirname,
  `./certs/${APPLE_PASS_TYPE_IDENTIFIER}-key.pem`);

const APPLE_WEB_SERVICE_URL = 'https://passbook-server.run.aws-usw02-pr.ice.predix.io/api';
const APPLE_PASS_TYPE_IDENTIFIER_P12 = process.env.APPLE_PASS_TYPE_IDENTIFIER_P12 || path.resolve(__dirname,
  `../src/certificates/${APPLE_PASS_TYPE_IDENTIFIER}.p12`);

module.exports = {
  dataPath: path.resolve(__dirname, './temp'),
  "version": "v1",
  "teamIdentifier": APPLE_TEAM_IDENTIFIER,
  "passTypeIdentifier": APPLE_PASS_TYPE_IDENTIFIER,
  "webServiceURL": APPLE_WEB_SERVICE_URL,
  "certs": {
    wwdr: APPLE_WWDR,
    p12: APPLE_PASS_TYPE_IDENTIFIER_P12,
    passphrase: 'test'
  },
  "passkit": {
    "version": "v1",
    "teamIdentifier": APPLE_TEAM_IDENTIFIER,
    "passTypeIdentifier": APPLE_PASS_TYPE_IDENTIFIER,
    "webServiceURL": APPLE_WEB_SERVICE_URL
  }
};
