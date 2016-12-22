const mongoose = require('mongoose')

const Transaction = mongoose.Schema({
	date: Date,
	ref: String,
	platform: String,
	amount: Number,
	duration: Number,
	type: String // create, extend
})

const schema = mongoose.Schema({
	_user: {type: mongoose.Schema.ObjectId, ref: 'User'},
	_serie: {type: mongoose.Schema.ObjectId, ref: 'Serie'},
	_story: {type: mongoose.Schema.ObjectId, ref: 'Story'},
	_episode: {type: mongoose.Schema.ObjectId, ref: 'Episode'},
	_mailCursor: {type: mongoose.Schema.ObjectId, ref: 'Episode'}, // dernier épisode envoyé par mail

	reader: String, // destinataire pour l'envois des emails
	transactions: [Transaction],

	created: Date,
	updated: Date,
	starts: Date,
	ends: Date,

}, {
	collection: 'subscription'
})

schema.pre('save', function(next){
	this.updated = new Date();

	if(this.isNew && !this.created){
		this.created = new Date();
		this.starts = new Date();
	}

	next();
});


const model = mongoose.model('Subscription', schema);

module.exports = model