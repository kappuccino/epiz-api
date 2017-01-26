const db = require('./database')
const server = require('./server');

var async = require('async');
const readline = require('readline');

process.on('uncaughtException', function(err) {
	console.log('Caught exception via (uncaughtException)');
	console.log(err.stack);
});

console.log("[λ] Environment is", process.env.NODE_ENV || 'base');

function start(cb){

	async.series([

		// Mongo
		function(next){
			const conf = `(host:${process.env.MONGO_HOST} db:${process.env.MONGO_DB} user:${process.env.MONGO_USER})`;
			process.stdout.write(`[λ] Starting mongodb ${conf} ...`);

			db.connect(() => {
				//readline.clearLine(process.stdout);
				//readline.cursorTo(process.stdout, 0);
				console.log(`started.`);
				next();
			});

		},

		// Express
		function(next){
			process.stdout.write(`[λ] Starting express... `);

			server.start((err, message) => {
				//readline.clearLine(process.stdout);
				//readline.cursorTo(process.stdout, 0);
				console.log(`started. (${message})`);
				next();
			});
		}

		// Final
	], function(err){
		console.log("--");
		cb(err)
	});

}

function stop(cb){

	async.series([

		// Mongo
		function(next){
			db.disconnect(() => {
				console.log("[✓] Stop mongodb.");
				next();
			});

		},

		// Express
		function(next){
			server.stop((err) => {
				console.log("[✓] Stop express");
				next(err);
			});
		}

		// Final
	], function(err){
		cb(err)
	});
}


module.exports = {
	start,
	stop
}
