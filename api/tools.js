var logger = require('./logger');

var Q = require('q')
	, path = require('path')
	, _ = require('lodash')
	, fs = require('fs')
	, async = require('async')
	, mongoose = require('mongoose');

// --

/**
 * Traite les options de recherches communes (limit, skip, by _ID ...)
 *
 * @param query
 * @param opt
 *
 * @returns {*}
 */
function sanitizeSearch(query, opt){

	var limit, skip, sort, sort_, noLimit;
	opt = opt || {};

	noLimit = !!opt.noLimit;

	// ID
	if('_id' in opt){
		var _id = opt._id;

		if('object' === typeof _id && _id.length){
			_id = _id.map((id) => new mongoose.Types.ObjectId(id));
			query.where('_id').in(_id);
		}else
		if('string' === typeof _id){
			_id = new mongoose.Types.ObjectId(_id);
			query.where('_id').equals(_id);
		}
	}

	// SORT
	if('sort' in opt){

		sort = opt['sort'];

		// On envois une string, elle sera consuite en {} (voir complexe)
		if('string' === sort && sort.indexOf('|') > -1){
			sort_ = sort.split('|');
			sort = {};

			sort_.forEach(function(e){
				var dir = e.substr(0, 1);

				if(dir == '-'){
					sort[e.substr(1)] = -1;
				}else{
					sort[e] = 1;
				}
			})
		}

		// Simple (1 champ)
		if('string' == typeof sort) query.sort(sort);

		// Complexe {truc: 1, muche: -1, machin: 1}
		if('object' == typeof sort) query.sort(sort);
	}

	// LIMIT
	if(!noLimit && 'limit' in opt){
		limit = parseInt(opt.limit);
		if(!limit) limit = 100;
		query.limit(limit);
	}

	// SKIP
	if(!noLimit && 'skip' in opt){
		skip = parseInt(opt.skip);
		if(!isNaN(skip)) query.skip(skip);
	}

	return query;
}

//--




/**
 * Réponse de l'API pour une requête ou tout s'est bien passé
 *
 * @param data
 * @param req
 * @param res
 */
function requestSuccess(data, req, res){
	res.json(data);
}

/**
 * Réponse de l'API quand on souhaite effectuer une action sur un element introuvable
 *
 * @param req
 * @param res
 */
function requestNotFound(req, res){

	res.status(404);

	// respond with json
	if(req.accepts('json')){
		res.send({ error: 'Not found' });
		return;
	}

	// default to plain-text. send()
	return res.type('text').send('Not found: '+ req.url);
}

/**
 * Réponse de l'API en cas d'echec
 *
 * @param err
 * @param req
 * @param res
 * @param next
 *
 * @returns {*}
 */
function requestFail(err, req, res, next){

	const code = err.code || 200

	if(code == 404) return requestNotFound(req, res, next)

	res.status(code)

	logger.debug(err)
	console.error(err.stack)


	// respond with json
	if(req.accepts('json')){
		return res.send({ name:err.name, error:err.message, stack:err.stack});
	}

	// respond with html page
	if(req.accepts('html')){
		return res.send([err.name, err.message, err.stack].join('\n'));
	}

	// default to plain-text. send()
	res.type('text').send([err.name, err.message, err.stack].join('\n'));


	return next(err)
}

/**
 * Réponse de l'API en cas d'erreur d'autentification
 *
 * @param key
 * @param req
 * @param res
 * @param next
 *
 * @returns {*}
 */
function requestUnauthorized(key, req, res, next){

	res.status(401);

	// respond with html page
	if(req.accepts('html')) {
		return res.send('<h1>Error 401: Unauthorized '+key+'</h1>');
	}

	// respond with json
	if(req.accepts('json')) {
		return res.send({ error: 'unauthorized '+key});
	}

	// default to plain-text. send()
	res.type('text').send('Error 401: Unauthorized '+key);

	return next(err)
}




/**
 * Determine le nombre total de donnée sans limit()
 *
 * @param query
 *
 * @returns {adapter.deferred.promise|*|promise|Q.promise}
 */
function queryTotal(query) {

	return new Promise((fullfill, reject) => {
		query.model.collection.count(query._conditions, (err, total) => {
			if(err) return reject(err)
			fullfill(total)
		})
	})

	//return query.model.collection.count(query._conditions)
}

/**
 * Recupère les résultats de la recherche
 *
 * @param query object
 * @param populate string List of fields (mongoose populate)
 *
 */
function queryResult(query, populate){

	//console.log('queryResult conditions', query._conditions, query.options)

	if(populate) query.populate(populate)

	return new Promise((resolve, reject) => {
		query.exec((err, docs) => {
			if(err) return reject(err)
			resolve(docs)
		});
	})

	//return query.exec()

}






//--

function checkAuth(key, req){

		return true;

		// Pas de auth
		if(!req.auth || !req.auth.auth) return false;

		// La clé "unicorn" donne tous les droits
		if(req.auth.auth['unicorn'] ===  true) return true;

		// Pas de clés pour cette autorisation
		if(!(key in req.auth.auth)) return false;

		return !!req.auth.auth[key];
}

function escapeRegex(str){
	return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function toObject(obj){

	return (function reduce(input){

		//console.log('>>>>', input)

		if(input instanceof mongoose.Types.ObjectId) return input.toString()

		// Primitive
		if(input == null || (typeof input !== 'function' && typeof input !== 'object')) return input

		if(Array.isArray(input)) return input.map(reduce)

		return Object.keys(input).reduce((prev, cur) => {

			var newValue = input[cur]

			if(Array.isArray(newValue)){
				newValue = input[cur].map(reduce)
			}else
			if(newValue instanceof mongoose.Types.ObjectId){
				newValue = newValue.toString()
			}

			return Object.assign(prev, {[cur]: newValue })
		}, input)

	})(obj)

}

function getRaw(model, _id){

	return new Promise((resolve, reject) => {

		// Si exception, reject() la promise
		_id = new mongoose.Types.ObjectId(_id)

		model.findOne({_id}, (err, doc) => {
			if (err) return reject(err)
			if (!doc) return reject(NotFound('serie not found'))

			resolve(doc)
		})

	})

}


//----------------------------------------------------------------------------------------------------------------------

function NotFound(name, message){
	this.error = true;
	this.code = 404;
	this.name = name || "NotFound";
	this.message = message || "Not found";
}

NotFound.prototype = new Error();
NotFound.prototype.constructor = NotFound;






function Exists(name, message){
	this.error = true;
	this.error = true;
	this.code = 500;
	this.name = name || "Exists";
	this.message = message || "Error: "+this.name;
}

Exists.prototype = new Error();
Exists.prototype.constructor = NotFound;




//--

Object.defineProperty(global, '__stack', {
	get: function() {
		var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function(_, stack) {
			return stack;
		};
		var err = new Error;
		Error.captureStackTrace(err, arguments.callee);
		var stack = err.stack;
		Error.prepareStackTrace = orig;
		return stack;
	}
});

Object.defineProperty(global, '__line', {
	get: function() {
		return __stack[1].getLineNumber();
	}
});

Object.defineProperty(global, '__function', {
	get: function() {
		return __stack[1].getFunctionName();
	}
});

Object.defineProperty(global, '__file', {
	get: function() {
		return __stack[1].getFileName()
	}
});


function trace(){
	logger.debug(`${__file}:${__line}`)
	;[...arguments].map(e => console.log(JSON.stringify(e, null, 2)))
}


//----------------------------------------------------------------------------------------------------------------------

//--
module.exports = {

	checkAuth,
	escapeRegex,
	toObject,
	getRaw,

	sanitizeSearch,

	queryTotal,
	queryResult,

	requestSuccess,
	requestNotFound,
	requestFail,
	requestUnauthorized,

	notFound: (err, msg) => new NotFound(err, msg),
	exists: (err, msg) => new Exists(err, msg),

	trace
}

/*


module.exports.modelUpdateFromData = modelUpdateFromData;
module.exports.modelUpdateFromDataSync = modelUpdateFromDataSync;




	module.exports.mediumFind = mediumFind;


*/
