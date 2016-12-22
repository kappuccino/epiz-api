const mongoose = require('mongoose')

const schema = mongoose.Schema({
	_serie: {type: mongoose.Schema.ObjectId, ref: 'Serie'},
	_story: {type: mongoose.Schema.ObjectId, ref: 'Story'},

	name: String,
	index: Number,
	content: String,

	created: Date,
	updated: Date
}, {
	collection: 'episode'
})

schema.pre('save', function(next){
	this.updated = new Date()
	if(this.isNew && !this.created) this.created = new Date()
	next()
})

const model = mongoose.model('Episode', schema);

module.exports = model