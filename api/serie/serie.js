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
			if(!doc) return reject(tools.notFound('serie not found'))

			resolve(tools.toObject(doc))
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

		const $serie = new model(data)

		return $serie.save()
			.then(serie => getById(serie._id))
			.then(serie => resolve(serie))
			.catch(err => reject(err))

	})

}

function update(_id, data){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		getById(_id)
			.then(serie => {
				delete data.__v

				const u = require('updeep')
				const updatedSerie = u(data, serie)

				const $serie = model(updatedSerie)
				$serie.isNew = false

				return $serie.save()
			})
			.then(serie => resolve(tools.toObject(serie)))
			.catch(err => reject(err))

	})

}

function remove(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndRemove({_id}).lean().exec()
			.then(serie => tools.toObject(serie))
			.then(serie => resolve(serie))
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

	if(!!opt.tag){
		query.where('tag').eq(opt.tag)
	}

	query = tools.sanitizeSearch(query, opt)

	// Note, mongoose query do have .then() function... using a dumb wrap as a workaround
	return Promise.resolve({query})
}





module.exports = {
	getById,
	search,
	create,
	update,
	remove
}