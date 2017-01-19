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

function nextStory(_story){

	let current

	return new Promise((reject, resolve) => {

		getById(_story)
			.then(story => {
				current = story
				return search({_serie: story._serie || '', is_free: false})
			})

			// prochain histoire dans la série
			.then(res => {
				return res.data
					.sort((a, b) => a.index > b.index)
					.filter(ep => ep.index > current.index)
					.map(x => x._id)
			})

			.then(next => {
				if(next.length) return resolve(next[0])
				resolve(false)
			})

			.catch(err => reject(err))

	})

}


function search(opt){

	let query = model.find().lean()
	opt = Object.assign({}, {limit:100, skip:0}, opt)

	return _search(query, opt)
		.then(q => {
			query = q.query
			tools.trace(query._conditions)

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
			.then(story => {
				event.emit('storyCreated', story)
				return resolve(story)
			})
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
			.then(story => {
				event.emit('storyUpdated', story)
				return resolve(tools.toObject(story))
			})
			.catch(err => reject(err))

	})

}

function remove(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndRemove({_id}).lean().exec()
			.then(story => tools.toObject(story))
			.then(story => {
				event.emit('storyRemoved', story)
				return resolve(story)
			})
			.catch(err => reject(err))

	})

}



//-- private fn()

function _search(query, opt){

	let pattern
	let async = false

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

	if('is_free' in opt){
		query.where('is_free').eq(opt.is_free)
	}

	query = tools.sanitizeSearch(query, opt)

	// ASYNC
	if('_user' in opt){
		async = _search_async(query, opt)
	}

	return async || Promise.resolve({query})
}

function _search_async(query, opt){

	return new Promise((resolve, reject) => {

		_search_async_user(query, opt)
			.then(wrapp => resolve(wrapp))
			.catch(err => reject(err))

	})

}

function _search_async_user(query, opt){

	// Objectif, avoir une lite d'ID de story autorisé
	// se basé sur la _serie

	const _user = opt._user

	// Pas de user = histoire gratuite seulement
	if(!_user){
		query.where('is_free').eq(true)
		return Promise.resolve({query})
	}

	// Pour un user donnée, on determine la liste des histoire auxquelle il a droit
	const subscriptionApi = require('../subscription/subscription')

	return subscriptionApi.getFromUserId(_user)
		.then(subs => {

			// Filter pour limiter les abonnements à la série
			subs = subs.filter(sub => sub._serie == opt._serie)
			if(!subs.length){
				query.where('_id').eq('000000000000000000000000') // Force an empty result
				return {query}
			}

			// Additionner toute les histoires couvertes par les abonnements
			let stories = []
			subs.forEach(sub => {
				if(!sub.reading || !sub.reading.length) return;
				const _ids = sub.reading.map(r => r._story)
				stories = [...stories, ..._ids]
			})
			if(!stories.length){
				query.where('_id').eq('000000000000000000000000') // Force an empty result
				return {query}
			}

			// Supprimer les doublons
			stories = stories.reduce((acc, next) => {
				if(acc.indexOf(next) == -1) acc.push(next)
				return acc
			}, [])

			query.where('_id').in(stories)
			return {query}
		})

}




module.exports = {
	getById,
	getFromSerie,
	nextStory,
	search,
	create,
	update,
	remove
}