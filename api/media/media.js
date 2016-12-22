const mongoose = require('mongoose')
const im = require('imagemagick')
const fs = require('fs')

const tools = require('../tools')
const logger = require('../logger')
const model = require('./model')
const s3 = require('../s3')

const sizes = [150, 600]


function getById(_id, raw=false){

	return new Promise((resolve, reject) => {

		_id = new mongoose.Types.ObjectId(_id)

		model.findOne({_id}).lean().exec((err, doc) => {
			if(err) return reject(err)
			if(!doc) return reject(tools.notFound('medium not found'))

			if(!raw) doc = dynamicUrl(doc)

			resolve(tools.toObject(doc))
		})

	})

}

function getByIds(_ids){

	return new Promise((resolve, reject) => {

		if(!_ids.length) throw new Error('_ids is empty')
		_ids = _ids.map(_id => new mongoose.Types.ObjectId(_id))

		model.find().in('_id', _ids).lean().exec((err, docs) => {
			if(err) return reject(err)
			resolve(tools.toObject(docs))
		})

	})

}

function search(opt){

	var query = model.find().lean()
	opt = Object.assign({}, {limit:100, skip:0}, opt)

	// Note: mongoose query are not promises, but they do have .then(). Solution, using an object wrapper

	return _search(query, opt)
		.then(q => {
			query = q.query
			//console.log(JSON.stringify(query._conditions, null, 2))
			return Promise.all([tools.queryResult(query), tools.queryTotal(query)])
		})
		.then(([data, total]) => {

			if(data.length) data = data.map(dynamicUrl)

			return ({total, limit: query.options.limit, skip: query.options.skip, data})
		})
}


function create(data){

	if(data._id) delete data._id

	return new Promise((resolve, reject) => {

		const $media = new model(data)

		$media.save()
			.then(medium => getById(medium._id))
			.then(medium => resolve(medium))
			.catch(err => reject(err))

	})

}

function generate(medium, file){

	let meta = {}
	let imgSize;

	return imageSize(file)
		.then(origin => {
			imgSize = origin

			return sizes
				.map(size => {
					if(size >= origin.width) return false
					return processFile(medium, size, file)
				})
				.filter(job => job !== false)

		})

		// Gathering all thumbnails data
		.then(processing => Promise.all(processing))
		.then(thumbnails => meta = Object.assign({}, meta, {thumbnails}))

		// Upload the source file
		.then(() => s3.upload(file, medium._id+'/'+thumbnailUrl(file)))

		// Gathering some properties
		.then(() => properties(imgSize, file))
		.then(properties => meta = Object.assign({}, meta, {properties}))

		// Clean the source file
		.then(() => clean(file))

		// Final output
		.then(() => meta)
}

function updateMeta(_id, meta){

	console.log(_id, meta)

	return new Promise((resolve, reject) => {

		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndUpdate({_id}, meta).lean().exec(err => {
			if(err) return reject(err)

			getById(_id)
				.then(medium => {
					console.log(medium)
					resolve(medium)
				})
				.catch(err => reject(err))
		})

	})

}


function update(_id, data){

	// Never update thoses fields
	delete data.url
	delete data.thumbnails

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		getById(_id, true)
			.then(medium => {
				delete data.__v

				const u = require('updeep')
				const updatedMedium = u(data, medium)

				const $medium = model(updatedMedium)
				$medium.isNew = false

				return $medium.save()
			})
			.then(() => getById(_id))
			.then(medium => resolve(tools.toObject(medium)))
			.catch(err => reject(err))

	})

}

function remove(_id){

	return new Promise((resolve, reject) => {

		if(!_id) throw new Error('No _id')
		_id = new mongoose.Types.ObjectId(_id)

		model.findOneAndRemove({_id}).lean().exec()
			.then(medium => tools.toObject(medium))
			.then(medium => resolve(medium))
			.catch(err => reject(err))

	})

}




// Private

function processFile(medium, size, file){

	let thumbnail = {}
	let localFile

	logger.debug('processFile()', size, file)

	const tmp = tempFile(file)

	return resize(size, file, tmp)

		// Get size
		.then(tmpFile => {
			localFile = tmpFile
			thumbnail.url = thumbnailUrl(tmpFile)
			return imageSize(tmpFile)
		})

		// Save size
		.then(dimensions => {
			thumbnail = Object.assign({}, thumbnail, dimensions)
			return thumbnail
		})

		// Upload the file
		.then(() => s3.upload(localFile, medium._id+'/'+thumbnail.name))

		// Clean local file
		.then(() => clean(localFile))

		// Final output all the {} related to this thumbnail
		.then(() => thumbnail)
}

function resize(width, src, dst){

	const options = {
		srcPath: src,
		dstPath: dst,
		quality: 0.8,
		width
	};

	return new Promise((resolve, reject) => {
		im.resize(options, (err, stdout, stderr) => {
			if(err) reject(err)
			resolve(dst)
		});
	})

}

function tempFile(src){
	const short = require('shortid')
	const path = require('path')

	const ext = path.extname(src)
	return `${src.substr(0, src.length-ext.length)}_${short.generate()}${ext}`
}

function imageSize(file){

	return new Promise((resolve, reject) => {
		im.identify(['-format', '%wx%h', file], (err, dimension) => {
			if(err) return reject(err)

			const [width, height] = dimension.split('x')

			return resolve({
				width: parseInt(width),
				height: parseInt(height)
			})

		})

	})

}

function properties(size, file){

	return Promise.all([
		property('size', file, fileWeight),
		{key: 'height', value: size.height},
		{key: 'width', value: size.width}
	])

	// retourne une liste de properties pour un fichier local
}

function property(key, file, fn){
	return fn.apply(null, [file])
		.then(value => ({key, value}))
}

function fileWeight(file){

	return new Promise((resolve, reject) => {

		fs.stat(file, (err, stats) => {
			if(err) return reject(err)
			resolve(stats.size)
		})
	})

}

function clean(file){

	return new Promise((resolve, reject) => {
		fs.unlink(file, err => {
			if(err) reject(err)
			resolve()
		})
	})

}

function remoteUrl(medium, url){

	const path = require('path')
	const ext = path.extname(medium.name)

	const [region, bucket] = [process.env.AWS_REGION, process.env.AWS_S3_BUCKET]

	return `https://s3-${region}.amazonaws.com/${bucket}/${medium._id}/${url}`
}

function thumbnailUrl(file){
	const path = require('path')
	return path.basename(file)
}

function dynamicUrl(data){

	data = Object.assign({}, data)

	data.url = remoteUrl(data, data.url)

	if(data.thumbnails && data.thumbnails.length){
		data.thumbnails = data.thumbnails.map(t => {
			t.url = remoteUrl(data, t.url)
			return t
		})
	}

	return data
}

function _search(query, opt){

	var pattern

	// Name = (firstName OR lastName)
	if('name' in opt){
		const name = opt.name

		if('string' === typeof name && name.length){
			pattern = tools.escapeRegex(name)
			query.where('name').regex(new RegExp(pattern, 'i'))
		}

	}

	query = tools.sanitizeSearch(query, opt)

	// Note, mongoose query do have .then() function... using a dumb wrap as a workaround
	return Promise.resolve({query})
}


module.exports = {
	getById,
	getByIds,
	search,
	create,
	update,
	updateMeta,
	remove,

	generate
}