const mongoose = require('mongoose')

const schema = mongoose.Schema({
	question: String,
	content: String,
	index: Number,

	created: Date,
	updated: Date
}, {
	collection: 'faq'
})

schema.pre('save', function(next){
	this.updated = new Date()
	if(this.isNew && !this.created) this.created = new Date()
	next()
})

const model = mongoose.model('Faq', schema);

module.exports = model