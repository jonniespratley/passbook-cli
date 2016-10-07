'use strict';
const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
const Chance = require('chance');
const chance = new Chance();
const config = require('./test-config');
const request = require('request');
request.debug = true;
const BASE_URL = 'http://localhost:4987/passbook-server';

var sendDoc = (doc) =>{
  return new Promise((resolve, reject) =>{
    request({
      url: `${BASE_URL}/${doc._id}`,
      json: true,
      body: doc,
      method: 'PUT'
    }, (err, resp, body)=>{
      if(err){
        reject(err);
      }
      resolve(body);
    });
  });
}

glob(path.resolve(__dirname, './temp/**/pass.json'), (err, files)=>{
  files.forEach((file) =>{
    let doc = fs.readJsonSync(file);
    doc.authenticationToken = chance.apple_token();
    doc.serialNumber = chance.apple_token();
    doc.webServiceURL = config.webServiceURL;
    doc._id = String(doc.passTypeIdentifier + '-' + doc.serialNumber).replace(/\W/g, '-');

/*
    sendDoc(doc).then((resp) =>{
      console.log('send', resp);
      fs.outputJsonSync(file, doc);

      console.log('send file', doc._id, file);
    });
    */

  });
});






var utils = require('../src/utils');

var passes = [];


var options = {
  method: 'GET',
  url: 'https://pouchdb.run.aws-usw02-pr.ice.predix.io/passbook-server/_all_docs',
  json: true,
  qs:
   { include_docs: 'true',
     'start-key': 'pass-a',
     'end-key': 'pass-z' },
  headers:
   {
     'cache-control': 'no-cache',
     'content-type': 'application/json',
     accept: 'application/json',
     authorization: 'Basic YWRtaW46ZnJlZA==' } };

request(options, function (error, response, body) {
  console.log(error);

  console.log(body);
});
