const user = require('./user')
const tools = require('../tools')

module.exports = function(router){

// CHECK

	/**
	 * @api {post} /user/exists Check if a user exists or not
	 * @apiName UserExists
	 * @apiGroup User
	 * @apiPermission user_exists
	 *
	 * @apiParam (Body) {String} field The field to check (email, _id)
	 * @apiParam (Body) {String} value The value to check
	 */
	router.post('/user/exists', function exists(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_exists', req)){
			return tools.requestUnauthorized('user_exists', req, res, next);
		}

		user.exists(req.body.login)
			.then(exists => tools.requestSuccess({exists}, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



// SEARCH

	/**
	 * @api {post} /user Search for user
	 * @apiName UserSearch
	 * @apiGroup User
	 * @apiPermission user_search
	 *
	 * @apiParam (Body) {String} ....
	 */
	router.post('/user', function search(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_search', req)){
			return tools.requestUnauthorized('user_search', req, res, next);
		}

		user.search(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {get} /user/:id Get a user by id
	 * @apiName UserGetbyid
	 * @apiGroup User
	 * @apiPermission user_get
	 *
	 * @apiParam {String} id The user ID
	 */
	router.get('/user/:id([0-9a-f]{24})', function getById(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_get', req)){
			return tools.requestUnauthorized('user_get', req, res, next);
		}

		user.getById(req.params.id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// CREATE

	/**
	 * @api {put} /user Create a new user
	 * @apiName UserCreate
	 * @apiGroup User
	 * @apiPermission user_create
	 */
	router.put('/user', function create(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_create', req)){
			return tools.requestUnauthorized('user_create', req, res, next);
		}

		user.create(req.body)
			.then(data => {
				if(req.body.send_mail) user.createSendMail(data) // on n'attends pas la fin de cette fonction
				return data
			})
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// UPDATE

	/**
	 * @api {post} /user/:id Update a user
	 * @apiName UserUpdate
	 * @apiGroup User
	 * @apiPermission user_update
	 *
	 * @apiParam {String} id The user iD
	 */
	router.post('/user/:_id([0-9a-f]{24})', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_update', req)){
			return tools.requestUnauthorized('user_update', req, res, next);
		}

		user.update(req.params._id, req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {post} /user/:id/verification Update the user is_verified field is the verification code match
	 * @apiName UserVerification
	 * @apiGroup User
	 * @apiPermission user_verification
	 *
	 * @apiParam {String} id The user id
	 */
	router.post('/user/:_id([0-9a-f]{24})/verification', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_verification', req)){
			return tools.requestUnauthorized('user_verification', req, res, next);
		}

		user.verification(req.params._id, req.body.verification)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



// REMOVE

	/**
	 * @api {delete} /user/:id/:univers Delete a user
	 * @apiName UserDelete
	 * @apiGroup User
	 * @apiPermission user_delete
	 *
	 * @apiParam {String} id The user id
	 * @apiParam {String} univers The univers you want to remove the user from
	 */
	router.delete('/user/:_id([0-9a-f]{24})', function remove(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_delete', req)){
			return tools.requestUnauthorized('user_delete', req, res, next);
		}

		user.remove(req.params._id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {delete} /user/remove-batch Delete some dealers
	 * @apiName UserDeleteBatch
	 * @apiGroup User
	 * @apiPermission user_delete
	 *
	 * @apiParam (Body) {Array} _ids An array of _id to remove
	 */
	router.post('/user/remove', function removeBatch(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_delete', req)){
			return tools.requestUnauthorized('user_delete', req, res, next);
		}

		user.removeBatch(req.body._ids)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



// MAIL

	/**
	 * @api {post} /user/sponsor-mail Send an email to a bunch of friends to become their sponsor
	 * @apiName UserSponsorMail
	 * @apiGroup User
	 * @apiPermission user_sponsor
	 */
	router.post('/user/sponsor-mail', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_sponsor', req)){
			return tools.requestUnauthorized('user_sponsor', req, res, next);
		}

		user.sponsorMail(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {post} /user/:id/verification-mail Send an email to a a user with his verification code
	 * @apiName UserVerificationCode
	 * @apiGroup User
	 * @apiPermission user_verification_code
	 */
	router.get('/user/:id([0-9a-f]{24})/send-code', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_verification_code', req)){
			return tools.requestUnauthorized('user_verification_code', req, res, next);
		}

		user.getById(req.params.id)
			.then(data => {
				user.createSendMail(data) // on attends pas la fin de cette fonction
				return data
			})
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



// AUTH

	/**
	 * @api {post} /user/login Get an auth from a login
	 * @apiName UserLogin
	 * @apiGroup User
	 *
	 * @apiParam (Body) {String} login The login
	 * @apiParam (Body) {String} passwd The passwd
	 */
	router.post('/user/login', function login(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_login', req)){
			return tools.requestUnauthorized('user_login', req, res, next);
		}

		user.login(req.body.login, req.body.passwd)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})

	/**
	 * @api {post} /user/lost Send an email to a user with a lost code
	 * @apiName UserLost
	 * @apiGroup User
	 *
	 * @apiParam (Body) {String} login The login
	 */
	router.post('/user/lost', function login(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_last', req)){
			return tools.requestUnauthorized('user_lost', req, res, next);
		}

		user.lost(req.body.login)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})

	/**
	 * @api {post} /user/lost-check Check if a lost code is good
	 * @apiName UserLostCheck
	 * @apiGroup User
	 *
	 * @apiParam (Body) {String} login The login
	 * @apiParam (Body) {String} code The code
	 */
	router.post('/user/lost-check', function login(req, res, next){

		// Check Auth
		if(!tools.checkAuth('user_lost', req)){
			return tools.requestUnauthorized('user_lost', req, res, next)
		}

		user.lostCheck(req.body.login, req.body.code)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})

	/**
	 * @api {post} /user/reset/:token Get a reset token to change the password later
	 * @apiName UserPrepareReset
	 * @apiGroup User
	 *
	 * @apiParam (Body) {String} login The login
	 */
	router.get('/user/:_id([0-9a-f]{24})/reset', function prepareReset(req, res, next){

		user.prepareReset(req.params._id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})

	/**
	 * @api {post} /auth/reset/:token Change the password from a reset request
	 * @apiName AuthResetPassword
	 * @apiGroup Auth
	 *
	 * @apiParam        {String} reset The reset token
	 * @apiParam (Body) {String} passwd The new password
	 */
	router.post('/user/:_id([0-9a-f]{24})/reset/:reset([0-9a-f]{24})', function resetPassword(req, res, next){

		user.resetPassword(req.params._id, req.params.reset, req.body.passwd)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})

}
