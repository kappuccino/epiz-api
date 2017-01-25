const mongoose = require('mongoose')

const event = require('../event')
const tools = require('../tools')
const logger = require('../logger')
const model = require('./model')


function get(_id){

	return new Promise((resolve, reject) => {

		// Si exception, reject() la promise
		_id = new mongoose.Types.ObjectId(_id)

		model.find().lean().exec((err, docs) => {
			if(err) return reject(err)
			const doc = docs.length ? docs[0] : {}
			resolve(tools.toObject(doc))
		})

	})

}

function update(data){

	return new Promise((resolve, reject) => {

		get()
			.then(announcement => {
				delete data.__v

				const u = require('updeep')
				const updatedAnnouncement = u(data, announcement)

				const $announcement = model(updatedAnnouncement)
				$announcement.isNew = false

				return $announcement.save()
			})
			.then($announcement=> $announcement.toObject())
			.then(announcement => {
				event.emit('announcementUpdated', announcement)
				return resolve(tools.toObject(announcement))
			})
			.catch(err => reject(err))

	})

}




module.exports = {
	get,
	update,
}