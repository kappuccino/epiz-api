const mongoose = require('mongoose')

const event = require('../event')
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

function getFromUserId(_user){

	return new Promise((resolve, reject) => {

		_user = new mongoose.Types.ObjectId(_user)

		model.find({_user}).lean().exec((err, doc) => {
			if(err) return reject(err)
			resolve(tools.toObject(doc || []))
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
			.then($subscription => _reading($subscription))
			.then($subscription => getById($subscription._id))
			.then(subscription => {
				event.emit('subscriptionCreated', subscription)
				return resolve(subscription)
			})
			.catch(err => reject(err))

	})

}

function update(_id, data){

	console.log(_id, data)

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
			.then($subscription => _reading($subscription))
			.then($subscription => $subscription.toObject())
			.then(subscription => {
				event.emit('subscriptionUpdated', subscription)
				return resolve(tools.toObject(subscription))
			})
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

				const transaction = _transaction(duration, data)

				console.log('*'.repeat(100))
				console.log(transaction)
				console.log(data)
				console.log('*'.repeat(100))

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
			.then(subscription => {
				event.emit('subscriptionRemoved', subscription)
				return resolve(subscription)
			})
			.catch(err => reject(err))

	})

}

function removeForUser(_user){

	return new Promise((resolve, reject) => {

		if(!_user) throw new Error('no user _id')
		_user = new mongoose.Types.ObjectId(_user)

		model.find({_user}).lean().exec()
			.then(docs => {
				if(!docs.length) return Promise.resolve()

				model.remove({_user}).lean().exec()
					.then(docs => tools.toObject(docs))
					.then(docs => {
						event.emit('subscriptionsRemoved', docs)
						return resolve(docs)
					})

			})
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

function forward(_id){

	console.log(`Forward ${_id}`)
	let _episode

	const moment = require('moment')
	const now = moment().format('YYYY-MM-DD')

	return getById(_id)
		.then(sub => {

			if(sub.forwardCursor == now) return false

			_episode = sub._episode
			if(!_episode || !sub._story || !sub._serie) return false

			const api = require('../serie/serie')

			return api.getById(sub._serie)
				.then(serie => serie.reading)

		})
		.then(reading => {
			if(!reading.length) return false

			const index = reading.findIndex(r => r._episode === _episode)
			return reading[index+1]
		})
		.then(next => {
			if(!next) return getById(_id)


			return update(_id, {
				_story: next._story,
				_episode: next._episode,
				forwardCursor: now
			})

		})

}

function sendEpisodeByEmail(_id, bypass=false){

	const {	graphql } = require('graphql')
	const schema = require('../graphql/schema')

	const moment = require('moment')
	const now = moment().format('YYYY-MM-DD')

	return new Promise((resolve, reject) => {

		getById(_id)
			.then(sub => {

				// Pas la peine d'aller plus loin si on a pas d'épisode ou de destinataire
				if(!sub._episode || !sub.reader || (!bypass && sub.mailCursor == now)) return Promise.resolve(sub)

				const query = `
					query{
						episode: getEpisode(_id:"${sub._episode}"){
							name
							content
	
							serie{
								name
								textColor
								backgroundColor
							}
	
							story{
								name
							}
						}
					}
				`;

				return graphql(schema, query)
					.then(ep => _sendMail(sub, ep.data.episode))
					.then(() => sub)
			})

			.then(sub => {
				if(!bypass && sub.mailCursor != now) return update(_id, {mailCursor:now})
				return sub
			})
			.then(sub => resolve(sub))
			.catch(err => reject(err))

	})

}



//-- private fn()

function _search(query, opt){

	(['_serie', '_story', '_episode', '_user'].forEach(f => {
		if(!opt[f]) return;
		const val =  new mongoose.Types.ObjectId(opt[f])
		query.where(f).eq(val)
	}))

	if(opt.fromUser){
		const _user = opt._user

		// _user in option but empty => serve dumb data
		if(_user){
			const val =  new mongoose.Types.ObjectId(opt._user)
			query.where('_user').eq(val)
		}else{
			query.where('_user').eq('000000000000000000000000') // query will returns no data
		}
	}

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

	tools.trace(query._conditions)

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
			stories = stories
				.filter(story => !story.is_free)
				.sort((a, b) => a.index > b.index)
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

function _reading($subscription){

	const _serie = $subscription.get('_serie').toString()
	const _story = $subscription.get('_story').toString()
	const _episode = $subscription.get('_episode').toString()

	if(!_serie || !_story || !_episode) return Promise.resolve($subscription)

	const storyApi = require('../story/story')
	const episodeApi = require('../episode/episode')

	let indexStory, indexEpisode

	return Promise.all([
		storyApi.getById(_story),
		episodeApi.getById(_episode)
	])

	// On recupère l'Index de l'Episode et de l'histoire courante
		.then(([story, episode]) => {
			indexStory = story.index
			indexEpisode = episode.index
		})

		// On Recupère toute les histoires pour la série en cours,
		.then(() => {
			const model = require('../episode/model')
			return model.find({_serie}).populate('_story').lean().exec()
		})

		// et on ne garde que ceux déjà lu
		.then(episodes => {

			let stories = episodes
				.reduce((acc, next) => {
					const story = acc.find(x => x._id == next._story._id)
					if(!story) acc.push(next._story)
					return acc
				}, [])
				.map(story => {
					story.episodes = []
					return story
				})
				.sort((a, b) => a.index > b.index)

			episodes.forEach(ep => {
				const index = stories.findIndex(s => s._id == ep._story._id)
				stories[index]['episodes'].push(ep)
			})

			stories = stories.map(story => {
				const ep = story.episodes.map(ep => ({
					_episode: ep._id,
					_story: story._id,
					indexEpisode: ep.index,
					indexStory: story.index
				}))

				return [...ep]
			})

			let final = []
			stories.map(items => {
				items = items.sort((a,b) => a.index > b.index)
				final = [...final, ...items]
			})

			// On supprimer tout ce qui > à l'index courant
			final = final.filter(item => {
				if(item.indexStory < indexStory) return true
				if(item.indexStory == indexStory && item.indexEpisode <= indexEpisode) return true
				return false
			})

			return final
		})

		// Save
		.then(reading => {
			return model.findOneAndUpdate({_id: $subscription._id}, {reading}, {new:true}).exec()
		})

}

function _sendMail(sub, episode){

	return new Promise((resolve, reject) => {

		const mandrill = require('mandrill-api')
		const client = new mandrill.Mandrill(process.env.MANDRILL_KEY)

		const to = sub.reader.trim()
			.split('\n')
			.map((email, i) => {
				return {
					email: email,
					type: i === 0 ? 'to' : 'bcc'
				}
			})

		const message = {
			to,
			from_email: 'noreply@epiz.fr',
			subject: `Epiz: ${episode.story.name} (${episode.name})`,
			global_merge_vars: [
				{name: 'serie', 'content': episode.serie.name},
				{name: 'color', 'content': episode.serie.backgroundColor},
				{name: 'color_text', 'content': episode.serie.textColor},
				{name: 'story', 'content': episode.story.name},
				{name: 'episode', 'content': episode.name},
				{name: 'content', 'content': episode.content},
				{name: 'nomore', 'content': process.env.EPIZ_NOMORE_EMAIL.replace('%_id%', sub._id)}
			]
		}

		client.messages.sendTemplate({
				'template_name': 'daily',
				'template_content': [{
					'name': 'example name',
					'content': 'example content'
				}],
				'message': message,
				'async': false,
				'ip_pool': '',
				'send_at': ''
			},
			(res) => resolve(),
			(err) => {
				// Mandrill returns the error as an object with name and message keys
				console.error('A mandrill error occurred: ' + err.name + ' - ' + err.message)

				// A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
				reject(err)
			}
		)


	})

}

module.exports = {
	getById,
	getFromTransactionId,
	getFromUserId,
	search,
	create,
	update,
	extend,
	remove,
	removeForUser,
	active,
	forward,
	sendEpisodeByEmail
}