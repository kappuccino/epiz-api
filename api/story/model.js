const mongoose = require('mongoose')

const schema = mongoose.Schema({
	_serie: {type: mongoose.Schema.ObjectId, ref: 'Serie'},

	name: String,
	index: Number,
	active: Boolean,
	is_free: Boolean,

	excerpt: String,

	created: Date,
	updated: Date

}, {
	collection: 'story'
})

schema.pre('save', function(next){
	this.updated = new Date()
	if(this.isNew && !this.created) this.created = new Date()

	// Quand on met à jour une Story, on met à jour les épisodes en conséquences (is_free = comme la story)
	if(!this.isNew){
		const is_free = this.get('is_free')

		const episode = require('../episode/model')
		episode
			.update(
				{ _story: this.get('_id') },
				{ $set: {is_free} },
				{ multi: true }
			)
			.lean()
			.exec()
	}

	next()
})

const model = mongoose.model('Story', schema);

module.exports = model