const async = require('async')

const user = require('./user/user')
const cache = require('./cache')
//const logger = require('./logger')

module.exports = function setup(){

	return function(req, res, next){

		var auth = req.headers['auth']
			, fromCache = false, User

		if(!auth) return next()

		const cacheKey = 'auth:'+auth
		//logger.debug(`Request AUTH is ${auth}`)

		async.waterfall([

			// Cache ?
			function __authFromCache(cb){

				cache.get(cacheKey, function(err, cached){
					if(err || !cached) return cb()
					cached = JSON.parse(cached)
					if(cached.user) User = cached.user
					fromCache = true
					cb()
				})
			},

			// DB ?
			function __authFromDb(cb){

				// On a déjà l'info
				if(User) return cb()

				// On intérroge la BDD pour récupérer l'Auth
				const user = require('./user/user')
				user.getById(auth)
					.then(usr => {
						//console.log('<user from auth>', JSON.stringify(user))
						User = usr
						cb()
					})
					.catch(err => cb()) // transparent
			},

			// Save in Cache
			function __authToCache(cb){

				// Ça vient de la cache, ou je n'ai aucune infos => rien à faire
				if(fromCache || !User) return cb()

				cache.set(cacheKey, User, 600)
				cb()
			}

		], function(err){
			if(User) req.user = User
			next(err)
		})

	}

}