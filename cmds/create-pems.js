/* create-pems commander component
 * To use add require('../cmds/create-pems.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';
const yaml = require('js-yaml');
const utils = require('../src/utils');
const logSymbols = require('log-symbols');
module.exports = (program) => {
	program
		.command('create-pems')
		.version('0.0.1')
		.description('Create the required certifcate and key from a .p12')
		.option('-i, --input []', 'Path to .p12 file')
		.option('-p, --passphrase []', 'Passphrase for .p12 file')
		.option('-o, --output []', 'Path to key/cert output')
	.action((args) => {
		var p12 = args.input;
		var passphrase = args.passphrase;
		var output = args.output;
		utils.createPemFiles(p12, passphrase, output).then((res) => {

			console.log(logSymbols.success, res.cert.filename);
			console.log(logSymbols.success, res.key.filename);
		}).catch((err) => {
			program.log.error(err);
		});

		//	console.log(args);

		//console.log(yaml.dump(options));

		// Your code goes here
	});

};
