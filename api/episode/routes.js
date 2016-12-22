const episode = require('./episode')
const tools = require('../tools')

module.exports = function(router){
	

// SEARCH

	/**
	 * @api {post} /episode Search for stories
	 * @apiName EpisodeSearch
	 * @apiGroup Episode
	 * @apiPermission episode_search
	 *
	 * @apiParam (Body) {String} ...
	 */
	router.post('/episode', function search(req, res, next){

		// Check Auth
		if(!tools.checkAuth('episode_search', req)){
			return tools.requestUnauthorized('episode_search', req, res, next);
		}

		episode.search(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {get} /episode/:id Get a episode by id
	 * @apiName EpisodeGetbyid
	 * @apiGroup Episode
	 * @apiPermission episode_get
	 *
	 * @apiParam {String} id The episode ID
	 */
	router.get('/episode/:id([0-9a-f]{24})', function getById(req, res, next){

		// Check Auth
		if(!tools.checkAuth('episode_get', req)){
			return tools.requestUnauthorized('episode_get', req, res, next);
		}

		episode.getById(req.params.id, req.query['auth'])
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// CREATE

	/**
	 * @api {put} /episode Create a new episode
	 * @apiName EpisodeCreate
	 * @apiGroup Episode
	 * @apiPermission episode_create
	 */
	router.put('/episode', function create(req, res, next){

		// Check Auth
		if(!tools.checkAuth('episode_create', req)){
			return tools.requestUnauthorized('episode_create', req, res, next);
		}

		episode.create(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// UPDATE

	/**
	 * @api {post} /episode/:id Update a episode
	 * @apiName EpisodeUpdate
	 * @apiGroup Episode
	 * @apiPermission episode_update
	 *
	 * @apiParam {String} id The episode id
	 */
	router.post('/episode/:_id([0-9a-f]{24})', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('episode_update', req)){
			return tools.requestUnauthorized('episode_update', req, res, next);
		}

		episode.update(req.params._id, req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



// REMOVE

	/**
	 * @api {delete} /episode/:id Delete a episode
	 * @apiName EpisodeDelete
	 * @apiGroup Episode
	 * @apiPermission episode_delete
	 *
	 * @apiParam {String} id The episode id
	 */
	router.delete('/episode/:_id([0-9a-f]{24})', function remove(req, res, next){

		// Check Auth
		if(!tools.checkAuth('episode_delete', req)){
			return tools.requestUnauthorized('episode_delete', req, res, next);
		}

		episode.remove(req.params._id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})
	

}
