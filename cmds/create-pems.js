/* create-pems commander component
 * To use add require('../cmds/create-pems.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';
const yaml = require('js-yaml');
const utils = require('../src/utils');


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

		//	var str = utils.getPkcs12CertCmd(args.input, args.passphrase, args.output);
		//console.log(str.cmd);
		//console.log('Using', p12);

		utils.createPemFiles(p12, passphrase, output).then((res) => {

			res.forEach((f) => {
				console.log('created', f.filename);
			});

		}).catch((err) => {
			//console.log(err);
		});

		//	console.log(args);

		//console.log(yaml.dump(options));

		// Your code goes here
	});

};
