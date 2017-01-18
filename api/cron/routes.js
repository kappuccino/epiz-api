const cron = require('./cron')
const tools = require('../tools')

module.exports = function(router){

	/**
	 * @api {post} /cron/forward Forward all subscription
	 * @apiName CronForward
	 * @apiGroup Cron
	 * @apiPermission cron_forward
	 *
	 */
	router.get('/cron/forward', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('cron_forward', req)){
			return tools.requestUnauthorized('cron_forward', req, res, next);
		}

		cron.forward()
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {post} /cron/mail Forward all subscription
	 * @apiName CronMail
	 * @apiGroup Cron
	 * @apiPermission cron_mail
	 *
	 */
	router.get('/cron/mail', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('cron_mail', req)){
			return tools.requestUnauthorized('cron_mail', req, res, next);
		}

		cron.mail()
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

}
