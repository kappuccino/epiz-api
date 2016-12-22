const winston = require('winston')

/**
 * Liste des levels possibles
 * - silly
 * - debug
 * - error
 * - info
 */

var transports = [
	new (winston.transports.Console)({
		level: 'silly',
		colorize: true
	})
]

if(process.env.LOG_FILE){
	transports.push(
		new (winston.transports.File)({
			filename: process.env.LOG_FILE
		})
	)
}

const logger = new (winston.Logger)({
	transports
});

// Meilleur rendu dans la console
logger.cli();

// Ne pas quitter sur une error
logger.exitOnError = false;

/*logger.trace = function(){

	var inputs = Array.prototype.slice.call(arguments)
			, util = require('util');

	inputs.forEach(function(i){
		console.log(util.inspect(i, {colors: true, showHidden: false, depth: null}));
	})

};*/


module.exports = logger;