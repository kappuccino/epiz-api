const transaction = require('./transaction')
const tools = require('../tools')

module.exports = function(router){
	

// SEARCH

	/**
	 * @api {post} /transaction Search for transactions
	 * @apiName TransactionSearch
	 * @apiGroup Transaction
	 * @apiPermission transaction_search
	 *
	 * @apiParam (Body) {String} ...
	 */
	router.post('/transaction', function search(req, res, next){

		// Check Auth
		if(!tools.checkAuth('transaction_search', req)){
			return tools.requestUnauthorized('transaction_search', req, res, next);
		}

		transaction.search(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {get} /transaction/:id Get a transaction by id
	 * @apiName TransactionGetbyid
	 * @apiGroup Transaction
	 * @apiPermission transaction_get
	 *
	 * @apiParam {String} id The transaction ID
	 */
	router.get('/transaction/:id([0-9a-f]{24})', function getById(req, res, next){

		// Check Auth
		if(!tools.checkAuth('transaction_get', req)){
			return tools.requestUnauthorized('transaction_get', req, res, next);
		}

		transaction.getById(req.params.id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// CREATE

	/**
	 * @api {put} /transaction Create a new transaction
	 * @apiName TransactionCreate
	 * @apiGroup Transaction
	 * @apiPermission transaction_create
	 */
	/*router.put('/transaction', function create(req, res, next){

		// Check Auth
		if(!tools.checkAuth('transaction_create', req)){
			return tools.requestUnauthorized('transaction_create', req, res, next);
		}

		transaction.create(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})*/



// UPDATE

	/**
	 * @api {post} /transaction/:id Update a transaction
	 * @apiName TransactionUpdate
	 * @apiGroup Transaction
	 * @apiPermission transaction_update
	 *
	 * @apiParam {String} id The transaction id
	 */
	/*router.post('/transaction/:_id([0-9a-f]{24})', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('transaction_update', req)){
			return tools.requestUnauthorized('transaction_update', req, res, next);
		}

		transaction.update(req.params._id, req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})*/

	/**
	 * @api {post} /transaction/:id/extend Extend a transaction
	 * @apiName TransactionExtend
	 * @apiGroup Transaction
	 * @apiPermission transaction_extend
	 *
	 * @apiParam {String} id The transaction id
	 */
	/*router.post('/transaction/:_id([0-9a-f]{24})/extend', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('transaction_extend', req)){
			return tools.requestUnauthorized('transaction_extend', req, res, next);
		}

		transaction.extend(req.params._id, req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})*/



// REMOVE

	/**
	 * @api {delete} /transaction/:id Delete a transaction
	 * @apiName TransactionDelete
	 * @apiGroup Transaction
	 * @apiPermission transaction_delete
	 *
	 * @apiParam {String} id The transaction id
	 */
	/*router.delete('/transaction/:_id([0-9a-f]{24})', function remove(req, res, next){

		// Check Auth
		if(!tools.checkAuth('transaction_delete', req)){
			return tools.requestUnauthorized('transaction_delete', req, res, next);
		}

		transaction.remove(req.params._id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})*/
	

}
