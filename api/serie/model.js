const mongoose = require('mongoose')

const Media = mongoose.Schema({
	_media: {type: mongoose.Schema.ObjectId, ref: 'Media'}
})

const schema = mongoose.Schema({
	name: String,
	index: Number,
	active: Boolean,
	textColor: String,
	backgroundColor: String,
	excerpt: String,
	tag: [String],

	media: [Media],
	_poster: {type: mongoose.Schema.ObjectId, ref: 'Media'},

	created: Date,
	updated: Date
}, {
	collection: 'serie'
})

schema.pre('save', function(next){
	this.updated = new Date()
	if(this.isNew && !this.created) this.created = new Date()
	next()
})

const model = mongoose.model('Serie', schema);

module.exports = model