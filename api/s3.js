var tools = require('./tools')
	, logger = require('./logger')

var Q = require('q')
	, async = require('async')
	, AWS = require('aws-sdk');


AWS.config.update({
	accessKeyId: process.env.AWS_KEY,
	secretAccessKey: process.env.AWS_SECRET,
	region: process.env.AWS_REGION
});

const bucket = process.env.AWS_S3_BUCKET

// @url http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/frames.html#!AWS/S3.html


function exists(key, cb){

	var now = new Date().getTime();

	var params
		, deferred = Q.defer()
		, s3 = new AWS.S3();

	// Ne pas avoir de / au debut
	if(key.substring(0,1) == '/') key = key.substr(1);

	params = {
		Bucket: bucket,
		Key: key
	};

	s3.headObject(params, function (err, data) {

		if(err) return deferred.reject(err);
		return deferred.resolve()
	});

	return deferred.promise;
}

function listingFiles(prefix){

	var params
		, deferred = Q.defer()
		, s3 = new AWS.S3();

	// Ne pas avoir de / au debut
	if(prefix.substring(0,1) == '/') prefix = prefix.substr(1);

	logger.debug('AWS Listing', prefix)

	params = {
		Bucket: bucket,
		Prefix: prefix,
		Delimiter: '/'
	};

	s3.listObjects(params, (err, data) => {

		if(err) return deferred.reject(err);
		if(!data.Contents || !data.Contents.length) return deferred.resolve([]);

		// Ne prendre que les fichiers (on se base sur la taille)
		data.Contents = data.Contents.filter(e => e.Size > 0)

		return deferred.resolve(data.Contents);
	});

	return deferred.promise
}

function removeRecursively(prefix, cb){

	var params
		, files = [];

	listingFiles(prefix)
		.then(function(keys){
			var s3;

			if(!keys.length) keys = [];

			// Get Objects
			keys.forEach(function(key){
				files.push({Key: key.Key})
			});

			// Add folder
			files.push({Key: prefix});

			// Remove Objects
			params = {
				Bucket: bucket,
				Delete: {Objects: files}
			};

			s3 = new AWS.S3();
			s3.deleteObjects(params, function(err, data){
				cb(err);
				//if(err) return cb(err);
			});

		})
		.fail(cb);

}

function remove(file, cb){

	var s3, params;

	// Ne pas avoir de / au debut
	if(file.substring(0,1) == '/') file = file.substr(1);

	s3 = new AWS.S3();
	params = {
		Bucket: bucket,
		Key: file
	};

	s3.deleteObject(params, function(err){
		cb(err)
	});
}

function upload(local, key){

	const fs = require('fs')
	const mime = require('mime')
	const url = require('url')

	var s3 = new AWS.S3()

	// Check if the key is a full url
	if(key.substring(0,4) == 'http') key = url.parse(key).path

	// Check if the key contain the bucket name
	if(key.substr(0, bucket.length+2) == `/${bucket}/`) key = key.substr(bucket.length+1)

	// We don't need a / on front of the key
	if(key.substring(0,1) == '/') key = key.substr(1);

	//logger.debug('Read file', local);

	return new Promise((resolve, reject) => {

		fs.readFile(local, function (err, data){
			if(err) return reject(err)

			//logger.debug('Ok, push to aws', key);

			const params = {
				ACL:'public-read',
				Bucket: bucket,
				Key: key,
				Body: data,
				ContentType: mime.lookup(key, 'application/octet-stream')
			};

			s3.putObject(params, (err) => {
				data = null;
				s3 = null;

				if(err){
					logger.error('AWS Error', err);
					return reject(err)
				}

				logger.debug(`S3: ${key}`);
				resolve(key)
			});

		});

	})


}



module.exports = {
	upload
}
