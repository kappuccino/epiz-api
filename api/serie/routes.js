const serie = require('./serie')
const tools = require('../tools')

module.exports = function(router){
	

// SEARCH

	/**
	 * @api {post} /serie Search for series
	 * @apiName SerieSearch
	 * @apiGroup Serie
	 * @apiPermission serie_search
	 *
	 * @apiParam (Body) {String} ....
	 */
	router.post('/serie', function search(req, res, next){

		// Check Auth
		if(!tools.checkAuth('serie_search', req)){
			return tools.requestUnauthorized('serie_search', req, res, next);
		}

		serie.search(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {get} /serie/:id Get a serie by id
	 * @apiName SerieGetbyid
	 * @apiGroup Serie
	 * @apiPermission serie_get
	 *
	 * @apiParam {String} id The serie ID
	 */
	router.get('/serie/:id([0-9a-f]{24})', function getById(req, res, next){

		// Check Auth
		if(!tools.checkAuth('serie_get', req)){
			return tools.requestUnauthorized('serie_get', req, res, next);
		}

		serie.getById(req.params.id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// CREATE

	/**
	 * @api {put} /serie Create a new serie
	 * @apiName SerieCreate
	 * @apiGroup Serie
	 * @apiPermission serie_create
	 */
	router.put('/serie', function create(req, res, next){

		// Check Auth
		if(!tools.checkAuth('serie_create', req)){
			return tools.requestUnauthorized('serie_create', req, res, next);
		}

		serie.create(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// UPDATE

	/**
	 * @api {post} /serie/:id Update a serie
	 * @apiName SerieUpdate
	 * @apiGroup Serie
	 * @apiPermission serie_update
	 *
	 * @apiParam {String} id The serie id
	 */
	router.post('/serie/:_id([0-9a-f]{24})', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('serie_update', req)){
			return tools.requestUnauthorized('serie_update', req, res, next);
		}

		serie.update(req.params._id, req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



// REMOVE

	/**
	 * @api {delete} /serie/:id Delete a serie
	 * @apiName SerieDelete
	 * @apiGroup Serie
	 * @apiPermission serie_delete
	 *
	 * @apiParam {String} id The serie id
	 */
	router.delete('/serie/:_id([0-9a-f]{24})', function remove(req, res, next){

		// Check Auth
		if(!tools.checkAuth('serie_delete', req)){
			return tools.requestUnauthorized('serie_delete', req, res, next);
		}

		serie.remove(req.params._id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})
	

}
