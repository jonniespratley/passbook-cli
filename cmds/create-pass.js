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
			utils.createPassAssets({
                name: args.name,
                type: args.type,
                output: args.output
            }).then((resp) => {
				console.log(logSymbols.success, resp);
			}).catch((err) =>{
                program.log.error(logSymbols.error, 'create-pass', err);
            });
		});

};
