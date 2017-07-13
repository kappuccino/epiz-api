const version = require('./version')
const tools = require('../tools')

module.exports = function(router){

	/**
	 * @api {get} /version Check if a version is compatible with this API
	 * @apiName Version
	 * @apiGroup Version
	 */
	router.get('/version', function(req, res, next){

		version.check(req.query.platform, req.query.version)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})


}
