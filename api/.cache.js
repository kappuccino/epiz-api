const redis = require('redis')
const crypto = require('crypto')

const logger = require('./logger')

var options = {
	db: process.env.REDIS_DB
}
if(process.env.REDIS_PASSW) options.password = process.env.REDIS_PASSW

var client = redis.createClient(
	process.env.REDIS_PORT,
	process.env.REDIS_HOST,
	options
)

client.on("error", function (err){
	logger.error('CACHE', err)
})

//--


function get(name, cb){
	client.get(name, cb);
}

function set(name, value, ttl){
	if('object' == typeof value) value = JSON.stringify(value)
	client.setex(name, ttl, value);//, redis.print)
}


//--

module.exports = {
	set,
	get
}
