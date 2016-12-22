const story = require('./story')
const tools = require('../tools')

module.exports = function(router){
	

// SEARCH

	/**
	 * @api {post} /story Search for stories
	 * @apiName StorySearch
	 * @apiGroup Story
	 * @apiPermission story_search
	 *
	 * @apiParam (Body) {String} ...
	 */
	router.post('/story', function search(req, res, next){

		// Check Auth
		if(!tools.checkAuth('story_search', req)){
			return tools.requestUnauthorized('story_search', req, res, next);
		}

		story.search(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {get} /story/:id Get a story by id
	 * @apiName StoryGetbyid
	 * @apiGroup Story
	 * @apiPermission story_get
	 *
	 * @apiParam {String} id The story ID
	 */
	router.get('/story/:id([0-9a-f]{24})', function getById(req, res, next){

		// Check Auth
		if(!tools.checkAuth('story_get', req)){
			return tools.requestUnauthorized('story_get', req, res, next);
		}

		story.getById(req.params.id, req.query['auth'])
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// CREATE

	/**
	 * @api {put} /story Create a new story
	 * @apiName StoryCreate
	 * @apiGroup Story
	 * @apiPermission story_create
	 */
	router.put('/story', function create(req, res, next){

		// Check Auth
		if(!tools.checkAuth('story_create', req)){
			return tools.requestUnauthorized('story_create', req, res, next);
		}

		story.create(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// UPDATE

	/**
	 * @api {post} /story/:id Update a story
	 * @apiName StoryUpdate
	 * @apiGroup Story
	 * @apiPermission story_update
	 *
	 * @apiParam {String} id The story id
	 */
	router.post('/story/:_id([0-9a-f]{24})', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('story_update', req)){
			return tools.requestUnauthorized('story_update', req, res, next);
		}

		story.update(req.params._id, req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



// REMOVE

	/**
	 * @api {delete} /story/:id Delete a story
	 * @apiName StoryDelete
	 * @apiGroup Story
	 * @apiPermission story_delete
	 *
	 * @apiParam {String} id The story id
	 */
	router.delete('/story/:_id([0-9a-f]{24})', function remove(req, res, next){

		// Check Auth
		if(!tools.checkAuth('story_delete', req)){
			return tools.requestUnauthorized('story_delete', req, res, next);
		}

		story.remove(req.params._id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})
	

}
