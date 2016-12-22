const mongoose = require('mongoose')
mongoose.Promise = global.Promise

function connect(cb){

	const uri = `mongodb://${process.env.MONGO_HOST}/${process.env.MONGO_DB}`
	const options = {
		user: process.env.MONGO_LOGIN,
		pass: process.env.MONGO_PASSWD
	}

	mongoose.connect(uri, options);

	var db = mongoose.connection;

	db.on('error', function(err){
		//console.error.bind(console, 'connection error:', err.stack)
		console.log('database.js >> db.onError', err.stack);
	});

	db.once('open', function callback(){
		//console.log('mongodb is up');
		if(cb) cb();
	});

}

function disconnect(cb){
	mongoose.connection.close(function(){
		//console.log('mongodb is down');
		if('function' === typeof cb) cb();
	})
}


//module.exports.mongoose = mongoose;
module.exports = {
	connect,
	disconnect
}