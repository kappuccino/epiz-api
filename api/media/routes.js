const media = require('./media')
const tools = require('../tools')

module.exports = function(router){

// SEARCH

	/**
	 * @api {post} /media Search for media
	 * @apiName MediaSearch
	 * @apiGroup Media
	 * @apiPermission media_search
	 *
	 * @apiParam (Body) {String} ....
	 */
	router.post('/media', function search(req, res, next){

		// Check Auth
		if(!tools.checkAuth('media_search', req)){
			return tools.requestUnauthorized('media_search', req, res, next);
		}

		media.search(req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})

	/**
	 * @api {get} /media/:id Get a medium by id
	 * @apiName MediaGetbyid
	 * @apiGroup Media
	 * @apiPermission media_get
	 *
	 * @apiParam {String} id The medium ID
	 */
	router.get('/media/:id([0-9a-f]{24})', function getById(req, res, next){

		// Check Auth
		if(!tools.checkAuth('media_get', req)){
			return tools.requestUnauthorized('media_get', req, res, next);
		}

		media.getById(req.params.id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))
	})



// UPLOAD

	/**
	 * @api {post} /media/upload Upload some files
	 * @apiName MediaUpload
	 * @apiGroup Media
	 * @apiPermission media_upload
	 */
	router.post('/media/upload', function search(req, res, next){

		// Check Auth
		if(!tools.checkAuth('media/upload', req)){
			return tools.requestUnauthorized('media/upload', req, res, next);
		}

		const formidable = require('formidable')
		const path = require('path')
		const s3 = require('../s3')

		const form = new formidable.IncomingForm()

		form.uploadDir = process.cwd()+'/temp'
		form.keepExtensions = true

		form.parse(req, function(err, fields, files){

			if(!files.file){
				return tools.requestFail({upload: false, msg: 'file missing'}, req, res, next)
			}

			let _id;
			const medium = {
				name: files.file.name,
				url: path.basename(files.file.path)
			}

			media.create(medium)
				.then(medium => {
					_id = medium._id
					return media.generate(medium, files.file.path)
				})
				.then(meta => media.updateMeta(_id, meta))
				.then(data => tools.requestSuccess(data, req, res))
				.catch(err => tools.requestFail(err, req, res, next))

		})

	})



// UPDATE

	/**
	 * @api {post} /media/:id Update a medium
	 * @apiName MediaUpdate
	 * @apiGroup Media
	 * @apiPermission media_update
	 *
	 * @apiParam {String} id The media id
	 */
	router.post('/media/:_id([0-9a-f]{24})', function update(req, res, next){

		// Check Auth
		if(!tools.checkAuth('media_update', req)){
			return tools.requestUnauthorized('media_update', req, res, next);
		}

		media.update(req.params._id, req.body)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})



// REMOVE

	/**
	 * @api {delete} /media/:id Delete a medium
	 * @apiName MediaDelete
	 * @apiGroup Media
	 * @apiPermission media_delete
	 *
	 * @apiParam {String} id The medium id
	 */
	router.delete('/media/:_id([0-9a-f]{24})', function remove(req, res, next){

		// Check Auth
		if(!tools.checkAuth('media_delete', req)){
			return tools.requestUnauthorized('media_delete', req, res, next);
		}

		media.remove(req.params._id)
			.then(data => tools.requestSuccess(data, req, res))
			.catch(err => tools.requestFail(err, req, res, next))

	})


}
