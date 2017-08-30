const amqp = require('amqp')
let connection

function getConnection(){

	if(connection){
		console.log('recycling connection')
		return Promise.resolve(connection)
	}

	console.log('getConnection()')

	return new Promise((resolve, reject) => {

		const params = {
			url: process.env.RABBIT_URL
		}

		connection = amqp.createConnection(params)

		connection.on('error', err => {
			console.error('Rabbit error')
			console.error(err)
			console.error(err.stack)
			reject(err)
		})

		connection.on('ready', () => {
			resolve(connection)
		})

	})

}

function getExchange(connection){

	//console.log('getExchange()')

	return new Promise(resolve => {

		const params = {
			type: 'direct',
			durable: true,
			autoDelete: false,
			confirm: true
		}

		const exchange = connection.exchange(process.env.RABBIT_EXCHANGE, params, () => {
			resolve(exchange)
		});

	})

}

function publish(key, msg){

	console.log('Rabbit push 1 msg')

	return getConnection()
		.then(connection => getExchange(connection))
		.then(exchange => {

			console.log('Publish()')

			return new Promise((resolve, reject) => {

				const props = {deliveryMode: 2, contentType: 'application/json'}

				exchange.publish(key, msg, props, (err) => {
					if(err) return reject(err)
					resolve(true)
				})

			})
		})
		.catch(err => {
			console.error(err)
		})

}


module.exports.getConnection = getConnection
module.exports.publish = publish