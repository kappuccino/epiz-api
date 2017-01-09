const mongoose = require('mongoose')

const tools = require('../tools')
const logger = require('../logger')
const model = require('./model')


// -- USER

function exists(login){

	return new Promise((resolve, reject) => {

		model.findOne({login}).lean().exec((err, doc) => {
			if(err) return reject(err)
			resolve(doc ? true : false)
		})

	})

}

function getById(_id){

	return new Promise((resolve, reject) => {

		// Si exception, reject() la promise
		_id = new mongoose.Types.ObjectId(_id)

		model.findOne({_id}).lean().exec((err, doc) => {
			if(err) return reject(err)
			if(!doc) return reject(tools.notFound('user not found'))

			// Never get the password
			delete doc.passwd

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

		if(!data.login) throw new Error('no login')
		if(!data.passwd) throw new Error('no passwd')

		exists(data.login)
			.then(exits => {
				if(exits) reject(new Error('user exists'))
			})
			.then(() => {
				const $user = new model(data)
				return $user.save()
			})
			.then(user => getById(user._id))
			.then(user => resolve(user))
			.catch(err => reject(err))

	})

}

function update(_id, data){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		getById(_id)
			.then(user => {
				delete data.__v

				const u = require('updeep')
				const updatedUser = u(data, user)

				const $user = model(updatedUser)
				$user.isNew = false

				if(!data.passwd) $user.unmarkModified('passwd')

				return $user.save()
			})
			.then(user => resolve(tools.toObject(user)))
			.catch(err => reject(err))

	})

}

function remove(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndRemove({_id}).lean().exec()
			.then(user => tools.toObject(user))
			.then(user => resolve(user))
			.catch(err => reject(err))

	})

}

function removeBatch(_ids){

	return new Promise((resolve, reject) => {

		if(!_ids || !_ids.length || !Array.isArray(_ids)) throw new Error('No _ids or empty array or not an array')

		const memo = [..._ids]
		_ids = _ids.map(_id => remove.apply(null, [_id]))

		Promise.all(_ids)
			.then(() => resolve(memo))
			.catch(err => reject(err))

	})
}


// -- AUTH

function login(login, passwd){

	const bcrypt = require('bcrypt-nodejs')

	return new Promise((resolve, reject) => {

		if(!login) throw new Error('no login')
		if(!passwd) throw new Error('no password')

		model.findOne({login}).lean().exec()
			.then(user => {
				if(!user) throw new Error('user not found')

				return new Promise((success, failure) => {
					bcrypt.compare(passwd, user.passwd, (err, res) => {
						if(true !== res) failure(new Error('password not match'))
						success(user._id)
					})
				})

			})
			.then(_id => getById(_id))
			.then(user => resolve(user))
			.catch(err => reject(err))

	})

}

function prepareReset(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findById(_id).exec()
			.then(user => {
				if(!user) throw new Error('user not found')

				user.set('reset', new mongoose.Types.ObjectId());
				return user.save()
			})
			.then(user => user.get('_id').toString())
			.then(_id => getById(_id))
			.then(user => resolve(user))
			.catch(err => reject(err))

	})

}

function resetPassword(user, reset, passwd){

	return new Promise((resolve, reject) => {

		if(!user) throw new Error('no user _id')
		if(!reset) throw new Error('no rest _id')
		if(!passwd) throw new Error('no passwd')

		reset = new mongoose.Types.ObjectId(reset)

		model.findOne({_id:user, reset:reset}).exec()
			.then($user => {
				if(!$user) throw new Error('user or reset token not found')

				$user.set('passwd', passwd)
				$user.set('reset', undefined)

				return $user.save()
			})
			.then($user => {
				console.log($user, '----')
				return $user.toObject()
			})
			.then(user => tools.toObject(user))
			.then(user => resolve(user))
			.catch(err => reject(err))

	})

}



//-- private fn()

function _search(query, opt){

	var pattern

	// Name = (firstName OR lastName)
	/*if('name' in opt){
		const name = opt.name;

		if('string' === typeof name && name.length){
			pattern = tools.escapeRegex(opt.name);

			query.or([
				{'firstName':  {'$regex': pattern, '$options': 'mi'}},
				{'lastName': {'$regex': pattern, '$options': 'mi'}}
			]);
		}

	}*/

	// Email
	if('login' in opt){
		const email = opt.login;

		if('string' === typeof email && login.length){
			pattern = tools.escapeRegex(opt.login);
			query.where('login').regex(new RegExp(pattern, 'i'));
		}

	}

	query = tools.sanitizeSearch(query, opt)

	// Note, mongoose query do have .then() function... using a dumb wrap as a workaround
	return Promise.resolve({query})
}





module.exports = {
	exists,
	getById,
	search,
	create,
	update,
	remove,
	removeBatch,

	login,
	prepareReset,
	resetPassword
}