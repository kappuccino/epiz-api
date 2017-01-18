const mongoose = require('mongoose')

const event = require('../event')
const tools = require('../tools')
const logger = require('../logger')
const model = require('./model')





// -- USER

function exists(login){

	return new Promise((resolve, reject) => {

		model.findOne({login}).lean().exec((err, doc) => {
			if(err) return reject(err)
			resolve(!!doc)
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

	let query = model.find().lean()
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
	if(!data.login) throw new Error('no login')
	if(!data.passwd) throw new Error('no passwd')

	if(!data.is_verified)  data.is_verified = false
	if(!data.verification) data.verification = _genRandom()

	return exists(data.login)
		.then(u => {
			if(u) throw new Error('user exists')
		})
		.then(() => {
			const code = data.sponsorCode;
			if(!code) return

			return model.findOne({sponsorCode:code})
		})
		.then(sponsor => {
			if(sponsor) data._sponsor = sponsor._id
		})
		.then(() => {
			const $user = new model(data)
			return $user.save()
		})
		.then(user => {
			event.emit('userCreated', user)
			return getById(user._id)
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
			.then(user => {
				event.emit('userUpdated', user)
				return resolve(tools.toObject(user))
			})
			.catch(err => reject(err))

	})

}

function verification(_id, verification){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		if(!verification) throw new Error('No verification')

		model.findOneAndUpdate({_id, verification}, {is_verified:true}).lean().exec()
			.then(() => getById(_id))
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
			.then(user => {
				event.emit('userRemoved', user)
				return resolve(user)
			})
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



// -- MAIL

function sponsorMail(data){

	let emails = data.emails;
	if(!emails) throw new Error('no email');

	emails = emails
		.split('\n')
		.map(x => x.trim())
		.filter(x => !!x)

	if(!emails.length) throw new Error('emails list is empty')

	// mandril format
	const to = emails.map(email => ({
		email: email, type: "to"
	}))

	return new Promise((resolve, reject) => {

		const mandrill = require('mandrill-api')
		const client = new mandrill.Mandrill(process.env.MANDRILL_KEY)

		const message = {
			to,
			subject: 'Découvrez Epiz',
			from_email: 'noreply@epiz.fr',
			from_name: 'Epiz',
			headers: {
				'Reply-To': data.from
			},
			text: data.body
		}

		client.messages.send(
			{"message": message, "async": false, "ip_pool": '', "send_at": ''},
			(res) => resolve({sucess: true}),
			(err) => {
				// Mandrill returns the error as an object with name and message keys
				console.error('A mandrill error occurred: ' + err.name + ' - ' + err.message)

				// A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
				reject(err)
			}
		);

	})

}

function createSendMail(data){

	return new Promise((resolve, reject) => {

		const mandrill = require('mandrill-api')
		const client = new mandrill.Mandrill(process.env.MANDRILL_KEY)

		const message = {
			to: [{email: data.login, type: 'to'}],
			from_email: 'noreply@epiz.fr',
			global_merge_vars: [
				{name: 'code', 'content': data.verification}
			]
		}

		client.messages.sendTemplate({
				'template_name': 'gribouille-check-email',
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

function mailchimpUpsert(user, merge_fields={}){

	// Do nothing in silence
	if(!user.login) return Promise.resolve(false)

	const md5 = require('md5')
	const Mailchimp = require('mailchimp-api-v3')
	const mailchimp = new Mailchimp(process.env.MAILCHIMP_APIKEY)

	return new Promise((resolve, reject) => {

		mailchimp.request({
			method : 'put',
			path : `/lists/${process.env.MAILCHIMP_LISTID}/members/${md5(user.login)}`,
			body : {
				email_address: user.login,
				status: 'subscribed',
				status_if_new: 'subscribed',
				merge_fields
			}
		}, (err, res) => {
			if(err) return reject(err)
			resolve(res)
		})

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

function lost(login){

	return new Promise((resolve, reject) => {

		if(!login) throw new Error('no login')
		const lost = _genRandom()

		model.findOneAndUpdate({login}, {lost}).lean().exec()
			.then(user => {
				if(!user) throw new Error('User not found')
				return user
			})
			.then(user => _sendLostCode(user.login, lost))
			.then(() => resolve({lost}))
			.catch(err => reject(err))

	})

}

function lostCheck(login, code){

	return new Promise((resolve, reject) => {

		if(!login) throw new Error('no login')
		if(!code) throw new Error('no code')

		model.findOneAndUpdate({login, lost:code}, {lost:undefined}).lean().exec()
			.then(user => {
				if(!user) throw new Error('User not found')
				return user._id
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

function _genRandom(min=10000, max=99999){
	return Math.round(Math.random() * (max - min) + min)
}

function _sendLostCode(email, code){

	return new Promise((resolve, reject) => {

		const mandrill = require('mandrill-api')
		const client = new mandrill.Mandrill(process.env.MANDRILL_KEY)

		const message = {
			template_name: 'gribouille-lost',
			to: [{email: email, type: "to"}],
			subject: 'Votre code de vérification Epiz',
			from_email: 'noreply@epiz.fr',
			global_merge_vars: [
				{name: 'code', 'content': code}
			]
		}

		client.messages.sendTemplate({
				'template_name': 'gribouille-lost',
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
	exists,
	getById,
	search,
	create,
	update,
	verification,
	remove,
	removeBatch,

	sponsorMail,
	createSendMail,
	mailchimpUpsert,

	login,
	lost,
	lostCheck,
	prepareReset,
	resetPassword
}