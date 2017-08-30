function forward(){

	const async = require('async')
	const rabbit = require('../rabbit')
	const model = require('../subscription/model')

	let subscriptions

	const fw = (sub, cb) => {
		sub = JSON.stringify(sub)

		rabbit.publish('forward', sub)
			.then(() => cb())
			.catch(() => cb())

	}

	return new Promise((resolve, reject) => {

		model.find({ends: {$gt: new Date()}}).lean().exec()
			.then(subs => {
				subscriptions = subs
				return rabbit.getConnection()
			})
			.then(() =>{

				async.eachLimit(subscriptions, 20, fw, (err) => {
					if (err) return reject(err)
					resolve(subscriptions.map(s => s._id))
				})

			})
			.catch(err => reject(err))

	})

}

function mail(){

	const async = require('async')
	const rabbit = require('../rabbit')
	const model = require('../subscription/model')

	let subscriptions

	const mail = (sub, cb) => {
		sub = JSON.stringify(sub)

		rabbit.publish('mail', sub)
			.then(() => cb())
			.catch(e => cb(e))

	}

	return new Promise((resolve, reject) => {

		const conds = {
			ends: {$gt: new Date()},
			reader: {$exists: true, $ne: ''}
		}

		console.log(conds)

		model.find(conds).lean().exec()
			.then(subs => {
				console.log('<count>', subs.length)
				subscriptions = subs
				return rabbit.getConnection()
			})
			.then(() =>{

				async.eachLimit(subscriptions, 20, mail, (err) => {
					if (err) return reject(err)
					resolve(subscriptions.map(s => s._id))
				})

			})
			.catch(err => reject(err))

	})

}

module.exports = {
	forward,
	mail
}