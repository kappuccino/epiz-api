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
			if(!doc) return reject(tools.notFound('episode not found'))

			resolve(tools.toObject(doc))
		})

	})

}

function getFromStory(_story){

	return new Promise((resolve, reject) => {

		// Si exception, reject() la promise
		_story = new mongoose.Types.ObjectId(_story)

		model.find({_story}).lean().exec((err, docs) => {
			if(err) return reject(err)
			if(!docs) return resolve([])

			docs = docs.map(tools.toObject)

			resolve(docs)
		})

	})

}

function search(opt){

	let query = model.find().lean()
	opt = Object.assign({}, {limit: 100, skip: 0, sort: {'index': -1}}, opt)

	// Note: mongoose query are not promises, but they do have .then(). Solution, using an object wrapper

	return _search(query, opt)
		.then(q => {
			query = q.query
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

		const $episode = new model(data)

		return $episode.save()
			.then(episode => getById(episode._id))
			.then(episode => {
				event.emit('episodeCreated', episode)
				return resolve(episode)
			})
			.catch(err => reject(err))

	})

}

function update(_id, data){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		getById(_id)
			.then(episode => {
				delete data.__v

				const u = require('updeep')
				const updatedEpisode = u(data, episode)

				const $episode = model(updatedEpisode)
				$episode.isNew = false

				return $episode.save()
			})
			.then(episode => {
				event.emit('episodeUpdated', episode)
				return resolve(tools.toObject(episode))
			})
			.catch(err => reject(err))

	})

}

function remove(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndRemove({_id}).lean().exec()
			.then(episode => tools.toObject(episode))
			.then(episode => {
				event.emit('episodeRemoved', episode)
				return resolve(episode)
			})
			.catch(err => reject(err))

	})

}



//-- private fn()

function _search(query, opt){

	let async
	let pattern

	// Name = (firstName OR lastName)
	if(!!opt.name){
		const name = opt.name

		if('string' === typeof name && name.length){
			pattern = tools.escapeRegex(name)
			query.where('name').regex(new RegExp(pattern, 'i'))
		}

	}

	if(!!opt._serie){
		let _serie = opt['_serie']

		if(Array.isArray(_serie)){
			_serie = _serie.map(id => new mongoose.Types.ObjectId(id))
			query.where('_serie').in(_serie)
		}else{
			 _serie = new mongoose.Types.ObjectId(_serie)
			query.where('_serie').eq(_serie)
		}

	}
	
	if(!!opt._story){
		let _story = opt['_story']

		if(Array.isArray(_story)){
			_story = _story.map(id => new mongoose.Types.ObjectId(id))
			query.where('_story').in(_story)
		}else{
			_story = new mongoose.Types.ObjectId(_story)
			query.where('_story').eq(_story)
		}
	}

	if('is_free' in opt){
		query.where('is_free').eq(opt.is_free)
	}

	query = tools.sanitizeSearch(query, opt)

	// ASYNC
	if(opt.fromUser) async = _search_async(query, opt)

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

	//logger.debug('_search_async_user()', opt)

	const _user = opt._user
	const transactions = opt.transactions

	// Pas de user ou par de transaction = episodes gratuits seulement
	if(!_user && !transactions.length){
		query.where('is_free').eq(true)
		return Promise.resolve({query})
	}

	// Pour un user donné, on determine la liste des histoire auxquelle il a droit
	const subscriptionApi = require('../subscription/subscription')

	// Tous les abonnements de cet utilisateur
	return subscriptionApi.getFromUser(_user, transactions)
		.then(subs => {

			// Filter pour limiter les abonnements qui concernent la Story en cours (d'après reading)
			subs = subs.filter(sub => {
				if(!sub.reading) return false
				const index = sub.reading.find(r => r._story == opt._story)
				return index !== undefined
			})
			if(!subs.length) return {query}

			//console.log('SUBSCRIPTIOn', subs.map(x => x._id))

			// Additionner toute les épisodes couverts par les abonnements
			let episodes = []
			subs.forEach(sub => {
				if(!sub.reading || !sub.reading.length) return;
				const _ids = sub.reading
					.filter(r => r._story == opt._story)
					.map(r => r._episode)

				episodes = [...episodes, ..._ids]
			})
			if(!episodes.length) return {query}

			// Supprimer les doublons
			episodes = episodes.reduce((acc, next) => {
				if(acc.indexOf(next) == -1) acc.push(next)
				return acc
			}, [])

			//tools.trace('EPISODES', episodes)

			query.where('_id').in(episodes)
			return {query}
		})

}




module.exports = {
	getById,
	getFromStory,
	search,
	create,
	update,
	remove
}