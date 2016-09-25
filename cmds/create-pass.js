/* create-pass commander component
 * To use add require('../cmds/create-pass.js')(program) to your commander.js based node executable before program.parse
 */
'use strict';

const utils = require('../src/utils');
const fs = require('fs-extra');
const logSymbols = require('log-symbols');

//console.log('logSymbols.info', logSymbols.info);
//console.log('logSymbols.warning', logSymbols.warning);
//console.log('logSymbols.success', logSymbols.success);
//console.log('logSymbols.error', logSymbols.error);

module.exports = (program) => {
	program
		.command('create-pass')
		.version('0.0.1')
		.description('Create a .raw pass package from pass type templates.')
		.option('-n, --name <name>', 'name of pass', 'pass')
		.option('-t, --type <generic>', 'pass type (boardingPass, coupon, eventTicket, generic, storeCard)', 'generic')
		.option('-o, --output <path>', 'path to output')
		.action((args) => {
			utils.createPassAssets(args.type, args.output, args.name).then((resp) => {
				program.log.info(logSymbols.success, 'create-pass', args.name, args.type, resp);
			});
		});

};
