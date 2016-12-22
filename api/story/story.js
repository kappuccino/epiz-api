const mongoose = require('mongoose')

const tools = require('../tools')
const logger = require('../logger')
const model = require('./model')


function getById(_id){

	return new Promise((resolve, reject) => {

		// Si exception, reject() la promise
		_id = new mongoose.Types.ObjectId(_id)

		model.findOne({_id}).lean().exec((err, doc) => {
			if(err) return reject(err)
			if(!doc) return reject(tools.notFound('story not found'))

			resolve(tools.toObject(doc))
		})

	})

}

function getFromSerie(_serie){

	return new Promise((resolve, reject) => {

		// Si exception, reject() la promise
		_serie = new mongoose.Types.ObjectId(_serie)

		model.find({_serie}).lean().exec((err, docs) => {
			if(err) return reject(err)
			if(!docs.length) return resolve([])

			docs = docs.map(tools.toObject)

			resolve(docs)
		})

	})

}


function search(opt){

	var query = model.find().lean()
	opt = Object.assign({}, {limit:100, skip:0}, opt)


	// Note: mongoose query are not promises, but they do have .then(). Solution, using an object wrapper

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

		if(!data.name) throw new Error('no name')

		const $story = new model(data)

		return $story.save()
			.then(story => getById(story._id))
			.then(story => resolve(story))
			.catch(err => reject(err))

	})

}

function update(_id, data){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		getById(_id)
			.then(story => {
				delete data.__v

				const u = require('updeep')
				const updatedStory = u(data, story)

				const $story = model(updatedStory)
				$story.isNew = false

				return $story.save()
			})
			.then(story => resolve(tools.toObject(story)))
			.catch(err => reject(err))

	})

}

function remove(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndRemove({_id}).lean().exec()
			.then(story => tools.toObject(story))
			.then(story => resolve(story))
			.catch(err => reject(err))

	})

}



//-- private fn()

function _search(query, opt){

	var pattern

	// Name = (firstName OR lastName)
	if(!!opt.name){
		const name = opt.name

		if('string' === typeof name && name.length){
			pattern = tools.escapeRegex(name)
			query.where('name').regex(new RegExp(pattern, 'i'))
		}

	}

	if(!!opt._serie){
		const _serie =  new mongoose.Types.ObjectId(opt._serie)
		query.where('_serie').eq(_serie)
	}

	query = tools.sanitizeSearch(query, opt)

	// Note, mongoose query do have .then() function... using a dumb wrap as a workaround
	return Promise.resolve({query})
}





module.exports = {
	getById,
	getFromSerie,
	search,
	create,
	update,
	remove
}