const subscription = require('./subscription')
const tools = require('../tools')

subscription.removeForUser('58774768325714ee2fe7e2d3')


module.exports = function(router){
	

// SEARCH

	/**
	 * @api {post} /subscription Search for subscriptions
	 * @apiName EubscriptionSearch
	 * @apiGroup Subscription
	 * @apiPermission subscription_search
	 *
	 * @apiParam (Body) {String} ...
	 */
	router.post('/subscription', function search(req, res, next){

		// Check Auth
		if(!tools.checkAuth('subscription_search', req)){
			return tools.requestUnauthorized('subscription_search', req, res, next);
		}

		subscription.search(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {get} /subscription/:id Get a subscription by id
	 * @apiName SubscriptionGetbyid
	 * @apiGroup Subscription
	 * @apiPermission subscription_get
	 *
	 * @apiParam {String} id The subscription ID
	 */
	router.get('/subscription/:id([0-9a-f]{24})', function getById(req, res, next){

		// Check Auth
		if(!tools.checkAuth('subscription_get', req)){
			return tools.requestUnauthorized('subscription_get', req, res, next);
		}

		subscription.getById(req.params.id, req.query['auth'])
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})

	/**
	 * @api {get} /subscription/:id/email Send an episode by email
	 * @apiName SubscriptionMail
	 * @apiGroup Subscription
	 * @apiPermission subscription_mail
	 *
	 * @apiParam {String} id The subscription ID
	 */
	router.get('/subscription/:id([0-9a-f]{24})/email', function getById(req, res, next){

		// Check Auth
		if(!tools.checkAuth('subscription_email', req)){
			return tools.requestUnauthorized('subscription_email', req, res, next);
		}

		subscription.sendEpisodeByEmail(req.params.id, req.query.bypass)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// CREATE

	/**
	 * @api {put} /subscription Create a new subscription
	 * @apiName SubscriptionCreate
	 * @apiGroup Subscription
	 * @apiPermission subscription_create
	 */
	router.put('/subscription', function create(req, res, next){

		// Check Auth
		if(!tools.checkAuth('subscription_create', req)){
			return tools.requestUnauthorized('subscription_create', req, res, next);
		}

		subscription.create(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// UPDATE

	/**
	 * @api {post} /subscription/:id Update a subscription
	 * @apiName SubscriptionUpdate
	 * @apiGroup Subscription
	 * @apiPermission subscription_update
	 *
	 * @apiParam {String} id The subscription id
	 */
	router.post('/subscription/:_id([0-9a-f]{24})', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('subscription_update', req)){
			return tools.requestUnauthorized('subscription_update', req, res, next);
		}

		subscription.update(req.params._id, req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {post} /subscription/:id/extend Extend a subscription
	 * @apiName SubscriptionExtend
	 * @apiGroup Subscription
	 * @apiPermission subscription_extend
	 *
	 * @apiParam {String} id The subscription id
	 */
	router.post('/subscription/:_id([0-9a-f]{24})/extend', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('subscription_extend', req)){
			return tools.requestUnauthorized('subscription_extend', req, res, next);
		}

		subscription.extend(req.params._id, req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {get} /subscription/:id/forward Forward a subscription
	 * @apiName SubscriptionForward
	 * @apiGroup Subscription
	 * @apiPermission subscription_extend
	 *
	 * @apiParam {String} id The subscription id
	 */
	router.get('/subscription/forward', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('subscription_forward', req)){
			return tools.requestUnauthorized('subscription_forward', req, res, next);
		}

		subscription.forward(req.params._id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {post} /subscription/:id/sync Attach _user to All subscription from a list of transaction ref
	 * @apiName SubscriptionSync
	 * @apiGroup Subscription
	 * @apiPermission subscription_sync
	 *
	 * @apiParam {String} id The subscription id
	 */
	router.post('/subscription/sync', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('subscription_sync', req)){
			return tools.requestUnauthorized('subscription_sync', req, res, next);
		}

		subscription.sync(req.body._user, req.body.refs)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



// REMOVE

	/**
	 * @api {delete} /subscription/:id Delete a subscription
	 * @apiName SubscriptionDelete
	 * @apiGroup Subscription
	 * @apiPermission subscription_delete
	 *
	 * @apiParam {String} id The subscription id
	 */
	router.delete('/subscription/:_id([0-9a-f]{24})', function remove(req, res, next){

		// Check Auth
		if(!tools.checkAuth('subscription_delete', req)){
			return tools.requestUnauthorized('subscription_delete', req, res, next);
		}

		subscription.remove(req.params._id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



}
