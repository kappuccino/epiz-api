const mongoose = require('mongoose')

const event = require('../event')
const tools = require('../tools')
const logger = require('../logger')
const model = require('./model')


function getById(_id){

	return new Promise((resolve, reject) => {

		// Si exception, reject() la promise
		_id = new mongoose.Types.ObjectId(_id)

		model.findOne({_id}).lean().exec((err, doc) => {
			if(err) return reject(err)
			if(!doc) return reject(tools.notFound('question not found'))

			resolve(tools.toObject(doc))
		})

	})

}

function search(opt){

	let query = model.find().lean()
	opt = Object.assign({}, {limit:100, skip:0}, opt)

	return _search(query, opt)
		.then(q => {
			query = q.query
			//console.log(JSON.stringify(query._conditions, null, 2))
			return Promise.all([tools.queryResult(query), tools.queryTotal(query)])
		})
		.then(([data, total]) => {
			return ({total, limit: query.options.limit, skip: query.options.skip, data})
		})
}

function create(data){

	if(data._id) delete data._id

	return new Promise((resolve, reject) => {

		if(!data.question) throw new Error('no question')

		const $question = new model(data)

		return $question.save()
			.then(question => getById(question._id))
			.then(question => {
				event.emit('questionCreated', question)
				return resolve(question)
			})
			.catch(err => reject(err))

	})

}

function update(_id, data){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		getById(_id)
			.then(question => {
				delete data.__v

				const u = require('updeep')
				const updatedQuestion = u(data, question)

				const $question = model(updatedQuestion)
				$question.isNew = false

				return $question.save()
			})
			.then($question => $question.toObject())
			.then(question => {
				event.emit('questionUpdated', question)
				return resolve(tools.toObject(question))
			})
			.catch(err => reject(err))

	})

}

function remove(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndRemove({_id}).lean().exec()
			.then(question => tools.toObject(question))
			.then(question => {
				event.emit('questionRemoved', question)
				return resolve(question)
			})
			.catch(err => reject(err))

	})

}



//-- private fn()

function _search(query, opt){

	let pattern

	// Question
	if(!!opt.question){
		const question = opt.question

		if('string' === typeof question && question.length){
			pattern = tools.escapeRegex(question)
			query.where('question').regex(new RegExp(pattern, 'i'))
		}

	}

	query = tools.sanitizeSearch(query, opt)

	return Promise.resolve({query})
}



module.exports = {
	getById,
	search,
	create,
	update,
	remove
}