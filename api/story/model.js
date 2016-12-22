const mongoose = require('mongoose')

const schema = mongoose.Schema({
	_serie: {type: mongoose.Schema.ObjectId, ref: 'Serie'},

	name: String,
	index: Number,
	active: Boolean,
	free: Boolean,

	excerpt: String,

	created: Date,
	updated: Date

}, {
	collection: 'story'
})

schema.pre('save', function(next){
	this.updated = new Date()
	if(this.isNew && !this.created) this.created = new Date()
	next()
})

const model = mongoose.model('Story', schema);

module.exports = model