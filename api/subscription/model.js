const mongoose = require('mongoose')

const Transaction = mongoose.Schema({
	date: Date,
	ref: String,
	platform: String,
	amount: Number,
	duration: Number,
	is_free: {type: Boolean, 'default': false},
	type: String, // create, extend
	method: String // check, creditcard, paypal, inapp
})

const schema = mongoose.Schema({
	_user: {type: mongoose.Schema.ObjectId, ref: 'User'},
	_serie: {type: mongoose.Schema.ObjectId, ref: 'Serie'},
	_story: {type: mongoose.Schema.ObjectId, ref: 'Story'},
	_episode: {type: mongoose.Schema.ObjectId, ref: 'Episode'},

	forwardCursor: String, // date du dernier forward
	mailCursor: String, // date du dernier envois par mail

	reader: String, // destinataire pour l'envois des emails
	transactions: [Transaction],

	created: Date,
	updated: Date,
	starts: Date,
	ends: Date,

	reading: {type: mongoose.Schema.Types.Mixed}

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