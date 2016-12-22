const mongoose = require('mongoose')

const tools = require('../tools')
const logger = require('../logger')
const model = require('../subscription/model')


function getById(_id){

	return new Promise((resolve, reject) => {

		_id = new mongoose.Types.ObjectId(_id)

		model.findOne({'transactions._id': _id}).lean().exec((err, doc) => {
			if(err) return reject(err)
			if(!doc) return reject(tools.notFound('subscription not found'))

			doc = tools.toObject(doc)

			const index = doc.transactions.findIndex(t => t._id == _id)
			const data = Object.assign({}, doc.transactions[index])

			data.subscription = doc

			resolve(data)
		})

	})

}

function search(opt){

	const conditions = {$match: {}} // on subscription
	const filters = {} // on transaction

	const skip = parseInt(opt.skip) || 0
	const limit = parseInt(opt.limit) || 50
	const unwind = {
		path: '$transactions',
		preserveNullAndEmptyArrays: false
	}
	const project = {
		_id: '$transactions._id',
		date: '$transactions.date',
		ref: '$transactions.ref',
		platform: '$transactions.platform',
		amount: '$transactions.amount',
		duration: '$transactions.duration',
		type: '$transactions.type'
	}

	// ... on subscription
	if(opt._user){
		conditions.$match = Object.assign({}, conditions.$match, {_user: new mongoose.Types.ObjectId(opt._user)})
	}

	if(opt.id_subscription){
		conditions.$match = Object.assign({}, conditions.$match, {_id: new mongoose.Types.ObjectId(opt.id_subscription)})
	}

	// ... on transaction
	if(opt.platform){
		filters.platform = opt.platform
	}

	if(opt.from || opt.to) filters.date = {}
	if(opt.from) filters.date['$gte'] = new Date(opt.from)
	if(opt.to)   filters.date['$lte'] = new Date(opt.to)

	const query = new Promise((resolve, reject) => {
		model
			.aggregate(conditions)
			.unwind(unwind)
			.project(project)
			.match(filters)
			.skip(skip)
			.limit(limit)
			.exec((err, res) => {
				if (err) return reject(err)
				resolve(res)
			})

	})

	const count = new Promise((resolve, reject) => {
		model
			.aggregate(conditions)
			.unwind(unwind)
			.project(project)
			.match(filters)
			.group({_id: null, count: {$sum: 1}})
			.exec((err, res) => {
				if (err) return reject(err)
				resolve(res.length ? res[0]['count'] : 0)
			})
	})

	return Promise.all([query, count])
		.then(res => {
			const [data, total] = res
			return {total, limit, skip, data}
		})


}

/*function create(data){

	if(data._id) delete data._id

	return new Promise((resolve, reject) => {

		if(!data._serie) throw new Error('no _serie')
		if(!data._story) throw new Error('no _story')
		if(!data._episode) throw new Error('no _episode')

		const duration = parseInt(data.duration)
		if(isNaN(Math.floor(duration)) || duration <= 0) throw new Error('duration is not valid')

		const $subscription = new model(data)

		// Set 'ends' from duration
		const ends = _dateFromDuration(duration);
		if(ends) $subscription.set('ends', ends)

		// Transaction
		if(data.transaction && Object.keys(data.transaction).length){
			const transaction = _transaction(duration, data.transaction)
			transaction.type = 'create'
			$subscription.set('transactions', [transaction])
		}

		return $subscription.save()
			.then(subscription => getById(subscription._id))
			.then(subscription => resolve(subscription))
			.catch(err => reject(err))

	})

}*/

/*function update(_id, data){

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

}*/

/*function extend(_id, data){

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

}*/

/*function remove(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndRemove({_id}).lean().exec()
			.then(subscription => tools.toObject(subscription))
			.then(subscription => resolve(subscription))
			.catch(err => reject(err))

	})

}*/



//-- private fn()

function _search(query, opt){

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
	const transaction = {
			date: new Date(),
			duration: duration
		}

		;['ref', 'platform', 'amount', 'type'].forEach(f => {
		if(data[f]) transaction[f] = data[f]
	})

	return transaction
}



module.exports = {
	getById,
	search,
	//create,
	//update,
	//extend,
	//remove
}