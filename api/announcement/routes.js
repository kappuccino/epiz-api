const announcement = require('./announcement')
const tools = require('../tools')

module.exports = function(router){
	

	/**
	 * @api {get} /announcement Get the announcement
	 * @apiName AnnouncementGet
	 * @apiGroup Announcement
	 * @apiPermission announcement_get
	 *
	 */
	router.get('/announcement', function get(req, res, next){

		// Check Auth
		if(!tools.checkAuth('announcement_get', req)){
			return tools.requestUnauthorized('announcement_get', req, res, next);
		}

		announcement.get()
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})

	/**
	 * @api {post} /announcement Update the announcement
	 * @apiName AnnouncementUpdate
	 * @apiGroup Announcement
	 * @apiPermission announcement_update
	 *
	 */
	router.post('/announcement', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('announcement_update', req)){
			return tools.requestUnauthorized('announcement_update', req, res, next);
		}

		announcement.update(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})




}
