const mongoose = require('mongoose')

const tools = require('../tools')
const logger = require('../logger')
const model = require('./model')


function getById(_id){

	return new Promise((resolve, reject) => {

		_id = new mongoose.Types.ObjectId(_id)

		model.findOne({_id}).lean().exec((err, doc) => {
			if(err) return reject(err)
			if(!doc) return reject(tools.notFound('subscription not found'))

			resolve(tools.toObject(doc))
		})

	})

}

function getFromTransactionId(transaction_id){

	return new Promise((resolve, reject) => {

		transaction_id = new mongoose.Types.ObjectId(transaction_id)

		model.findOne({'transactions._id': transaction_id}).lean().exec((err, doc) => {
			if(err) return reject(err)
			if(!doc) return reject(tools.notFound('subscription not found'))
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
			console.log(JSON.stringify(query._conditions, null, 2))
			return Promise.all([tools.queryResult(query), tools.queryTotal(query)])
		})
		.then(([data, total]) => {
			return ({total, limit: query.options.limit, skip: query.options.skip, data})
		})
}

function create(data){

	if(data._id) delete data._id

	return new Promise((resolve, reject) => {

		if(!data._serie) throw new Error('no _serie')

		const duration = parseInt(data.duration)
		if(isNaN(Math.floor(duration)) || duration <= 0) throw new Error('duration is not valid')

		// Consolidate (find first Story + first Episode)

		return _firstStoryAndEpisode(data._serie, data._story, data._episode)
			.then(first => {

				if(!first.story) throw new Error('no _story')
				data._story = first.story

				if(!first.episode) throw new Error('no _episode')
				data._episode = first.episode

				const $subscription = new model(data)

				// Set 'ends' from duration
				const ends = _dateFromDuration(duration);
				if(ends) $subscription.set('ends', ends)

				// Transaction
				if(data.transaction && Object.keys(data.transaction).length){
					const transaction = _transaction(duration, data.transaction)
					$subscription.set('transactions', [transaction])
				}

				// On sauve
				return $subscription.save()
			})
			.then(subscription => getById(subscription._id))
			.then(subscription => resolve(subscription))
			.catch(err => reject(err))

	})

}

function update(_id, data){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		getById(_id)
			.then(subscription => {
				delete data.__v

				const u = require('updeep')
				const updatedSubscription= u(data, subscription)

				const $subscription = model(updatedSubscription)
				$subscription.isNew = false

				return $subscription.save()
			})
			.then(subscription => resolve(tools.toObject(subscription)))
			.catch(err => reject(err))

	})

}

function extend(_id, data){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		const duration = parseInt(data.duration)
		if(isNaN(Math.floor(duration)) || duration <= 0) throw new Error('duration is not valid')

		getById(_id)
			.then(subscription => {

				const moment = require('moment')
				let ends = new moment(subscription.ends)

				if(ends.isBefore(new Date())) ends = moment()
				ends = ends.add(duration, 'days').toDate()

				const transaction = _transaction(duration, data.transaction)
				transaction.type = 'extend'

				return model.findOneAndUpdate(
					{_id},
					{$set: {ends}, $push: {transactions: transaction}},
					{'new': true}
				).lean().exec()
			})
			.then(subscription => resolve(tools.toObject(subscription)))
			.catch(err => reject(err))

	})

}

function remove(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndRemove({_id}).lean().exec()
			.then(subscription => tools.toObject(subscription))
			.then(subscription => resolve(subscription))
			.catch(err => reject(err))

	})

}

function active(){

	return new Promise((resolve, reject) => {

		model.find({ends: {$lt: new Date()} }).count().exec((err, total) => {
			if(err) return reject(err)
			resolve({total})
		})

	})

}


//-- private fn()

function _search(query, opt){

	console.log(opt)

	;['_serie', '_story', '_episode', '_user', '_mailCursor'].forEach(f => {
		if(!opt[f]) return;
		const val =  new mongoose.Types.ObjectId(opt[f])
		query.where(f).eq(val)
	})

	if('transactions.ref' in opt){
		const ref = opt['transactions.ref']
		Array.isArray(ref)
			? query.where('transactions.ref').in(ref)
			: query.where('transactions.ref').eq(ref)
	}

	if('starts' in opt && opt.starts){
		const starts = new Date(opt.starts)
		if(starts.getTime) query.where('starts').gte(starts)
	}

	if('ends' in opt && opt.ends){
		const ends = new Date(opt.ends)
		if(ends.getTime) query.where('ends').lte(ends)
	}

	//console.log(query._conditions);

	query = tools.sanitizeSearch(query, opt)

	// Note, mongoose query do have .then() function... using a dumb wrap as a workaround
	return Promise.resolve({query})
}

function _dateFromDuration(duration, now=new Date()){

	const moment = require('moment')
	if(!now) now = new Date()

	return moment(now).add(duration, 'days').toDate()
}

function _transaction(duration, data={}){

	const transaction = Object.assign({}, data, {
		duration,
		date: new Date(),
		type: data.type || 'create',
		is_free: data.is_free !== undefined ? data.is_free : false
	})

	if(transaction.is_free) transaction.amount = 0

	return transaction
}

function _firstStoryAndEpisode(serie, story=null, episode=null){

	let out = {serie, story, episode}

	return _getFirstStory(serie, story)
		.then((story) => {
			out.story = story
			return _getFirstEpisode(story, episode)
		})
		.then(episode => {
			out.episode = episode
			return out
		})

}

function _getFirstStory(serie, story=null){

	if(story) return Promise.resolve(story)

	const api = require('../story/story')

	return api.getFromSerie(serie)
		.then(stories => {
			stories = stories.sort((a, b) => a.index > b.index)
			return stories.length ? stories[0]._id : null;
		})
}

function _getFirstEpisode(story, episode=null){

	if(episode) return Promise.resolve(episode)

	const api = require('../episode/episode')

	return api.getFromStory(story)
		.then(episodes => {
			episodes = episodes.sort((a, b) => a.index > b.index)
			return episodes.length ? episodes[0]._id : null;
		})

}


module.exports = {
	getById,
	getFromTransactionId,
	search,
	create,
	update,
	extend,
	remove,
	active
}