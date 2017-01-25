const mongoose = require('mongoose')

const schema = mongoose.Schema({
	title: String,
	content: String,
	is_visible: Boolean,

	created: Date,
	updated: Date
}, {
	collection: 'announcement'
})

schema.pre('save', function(next){
	this.updated = new Date()
	if(this.isNew && !this.created) this.created = new Date()
	next()
})

const model = mongoose.model('Announcement', schema);

module.exports = model