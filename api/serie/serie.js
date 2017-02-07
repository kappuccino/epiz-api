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
			if(!doc) return reject(tools.notFound('serie not found'))

			resolve(tools.toObject(doc))
		})

	})

}

function search(opt){

	var query = model.find().lean()
	opt = Object.assign({}, {limit: 100, skip: 0, sort: {'index': -1}}, opt)

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
			.then(serie => {
				event.emit('serieCreated', serie)
				return resolve(serie)
			})
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
			.then($serie => _reading($serie))
			.then($serie => $serie.toObject())
			.then(serie => {
				event.emit('serieUpdated', serie)
				return resolve(tools.toObject(serie))
			})
			.catch(err => reject(err))

	})

}

function remove(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndRemove({_id}).lean().exec()
			.then(serie => tools.toObject(serie))
			.then(serie => {
				event.emit('serieRemoved', serie)
				return resolve(serie)
			})
			.catch(err => reject(err))

	})

}

function generateAllReading(){

	const async = require('async')

	return new Promise((resolve, reject) => {

		model.find().exec()
			.then($series => {
				if(!$series.length) return false

				async.eachLimit(
					$series, 10,
					($serie, cb) => {
						_reading($serie)
							.then(() => cb())
							.catch(err => cb(err))
					},
					(err) => reject(err)
				)

			})

	})

}



//-- private fn()

function _reading($serie){

	const _id = $serie.get('_id').toString()
	if(!_id) return Promise.resolve($serie)

	const storyApi = require('../story/story')
	const episodeApi = require('../episode/episode')

	let stories, episodes

	return Promise.all([
		storyApi.search({_serie: _id, noLimit: true}),
		episodeApi.search({_serie: _id, noLimit: true})
	])

		// On recupère toute les histoires et les épisodes de la série
		.then(([story, episode]) => {

			let final = []

			const episodes = episode.data
				.sort((a, b) => a.index > b.index)
				.map(ep => ({
					_episode: new mongoose.Types.ObjectId(ep._id),
					_story: new mongoose.Types.ObjectId(ep._story),
					indexEpisode: ep.index
				}))
				.reduce((acc, next) => {
					const _story = next._story
					if(!acc[_story]) acc[_story] = []
					acc[_story].push(next)

					return acc
				}, [])

			// On fait un gros tri pour avoir une liste ordonnée des épisodes

			story.data
				.sort((a, b) => a.index > b.index)
				.forEach(story => {
					const ep = (episodes[story._id] || [])
						.map(e => {
							e.indexStory = story.index
							return e
						})

					final = [...final, ...ep]
				})

			return final;
		})

		// Save
		.then(reading => {
			logger.debug(`Update serie reading ${_id} --> ${reading.length} episodes`)
			return model.findOneAndUpdate({_id: $serie._id}, {reading}, {new:true}).exec()
		})

}

function _search(query, opt){

	let async = false
	let pattern

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

	// ASYNC
	if(!!opt._user){
		async = _search_async(query, opt)
	}

	// Note, mongoose query do have .then() function... using a dumb wrap as a workaround
	return async || Promise.resolve({query})
}

function _search_async(query, opt){

	new Promise((resolve, reject) => {

		// pour le moment on renvois jute la réponse
		// on se servira plus tard de cette fonction pour gérer les cas async qui changent la query principal
		resolve({query})

	})


}




module.exports = {
	getById,
	search,
	create,
	update,
	remove,
	generateAllReading
}