const faq = require('./faq')
const tools = require('../tools')

module.exports = function(router){
	

// SEARCH

	/**
	 * @api {post} /faq Search for questions
	 * @apiName FaqSearch
	 * @apiGroup Faq
	 * @apiPermission faq_faq
	 *
	 * @apiParam (Body) {String} ....
	 */
	router.post('/faq', function search(req, res, next){

		// Check Auth
		if(!tools.checkAuth('faq_search', req)){
			return tools.requestUnauthorized('faq_search', req, res, next);
		}

		faq.search(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {get} /faq/:id Get a Quesiton by id
	 * @apiName FaqGetbyId
	 * @apiGroup Faq
	 * @apiPermission faq_get
	 *
	 * @apiParam {String} id The faq ID
	 */
	router.get('/faq/:id([0-9a-f]{24})', function getById(req, res, next){

		// Check Auth
		if(!tools.checkAuth('faq_get', req)){
			return tools.requestUnauthorized('faq_get', req, res, next);
		}

		faq.getById(req.params.id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// CREATE

	/**
	 * @api {put} /faq Create a new question
	 * @apiName FaqCreate
	 * @apiGroup Faq
	 * @apiPermission faq_create
	 */
	router.put('/faq', function create(req, res, next){

		// Check Auth
		if(!tools.checkAuth('faq_create', req)){
			return tools.requestUnauthorized('faq_create', req, res, next);
		}

		faq.create(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// UPDATE

	/**
	 * @api {post} /faq/:id Update a question
	 * @apiName FaqUpdate
	 * @apiGroup Faq
	 * @apiPermission faq_update
	 *
	 * @apiParam {String} id The quesiton id
	 */
	router.post('/faq/:_id([0-9a-f]{24})', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('faq_update', req)){
			return tools.requestUnauthorized('faq_update', req, res, next);
		}

		faq.update(req.params._id, req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



// REMOVE

	/**
	 * @api {delete} /faq/:id Delete a question
	 * @apiName FaqDelete
	 * @apiGroup Faq
	 * @apiPermission faq_delete
	 *
	 * @apiParam {String} id The faq id
	 */
	router.delete('/faq/:_id([0-9a-f]{24})', function remove(req, res, next){

		// Check Auth
		if(!tools.checkAuth('faq_delete', req)){
			return tools.requestUnauthorized('faq_delete', req, res, next);
		}

		faq.remove(req.params._id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})
	

}
