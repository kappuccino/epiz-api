'use strict'
require('dotenv').config({silent: true})

const request = require('request')
const cluster = require('cluster')

if(cluster.isMaster) {

	const numWorkers = process.env.WEB_CONCURRENCY || require('os').cpus().length
	console.log(`Master cluster setting up ${numWorkers} workers...`)

	for(let i = 0; i < numWorkers; i++) {
		cluster.fork()
	}

	cluster.on('online', function(worker) {
		console.log(`Worker ${worker.process.pid} is online`)
	})

	cluster.on('exit', function(worker, code, signal) {
		console.log(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`)
		console.log('Starting a new worker...')
		cluster.fork()
	})

} else {

	const rabbit = require('./api/rabbit')

	rabbit.getConnection()
		.then(connection => {

			connection.queue('forward', {durable: true, autoDelete: false}, (q) => {
				console.log('Listen on '+q.name)
				q.subscribe({ack: true}, (message, headers, deliveryInfo, messageObject) => {
					forward(q, message)
				})
			})

			connection.queue('mail', {durable: true, autoDelete: false}, (q) => {
				console.log('Listen on '+q.name)
				q.subscribe({ack: true}, (message, headers, deliveryInfo, messageObject) => {
					mail(q, message)
				})
			})

		})


}

function forward(q, msg){

	if(!msg._episode) return q.shift()

	const url = `${process.env.HOST}/subscription/${msg._id}/forward`
	console.log('forward', msg._id, url)

	request(url, (err, res, body) => {
		if(err) console.log(err)
		return q.shift()
	})

}

function mail(q, msg){

	if(!msg._episode || !msg.reader) return q.shift()

	const url = `${process.env.HOST}/subscription/${msg._id}/email`
	console.log('mail', url)

	request(url, (err, res, body) => {
		if(err) console.log(err)
		return q.shift()
	})

}
