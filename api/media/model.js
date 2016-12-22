const mongoose = require('mongoose')

const Thumbnails = mongoose.Schema({
	url: String,
	height: Number,
	width: Number
})

const Properties = mongoose.Schema({
	key: String,
	value: mongoose.Schema.Types.Mixed
})

const schema = mongoose.Schema({
	name: String,
	url: String,

	created: Date,
	updated: Date,

	thumbnails: [Thumbnails],
	properties: [Properties]

}, {
	collection: 'media'
})

schema.pre('save', function(next){
	this.updated = new Date()
	if(this.isNew && !this.created) this.created = new Date()
	next()
})

const model = mongoose.model('Media', schema);

module.exports = model