const mongoose = require('mongoose')

const schema = mongoose.Schema({
	_sponsor: {type: mongoose.Schema.ObjectId, ref: 'User'},

	login: String,
	passwd: String,
	auth: mongoose.Schema.Types.Mixed, // Liste d'autorisation (utilisé par l'API — userGet(1|0) userDelete(1|0) ... )
	reset: {type: mongoose.Schema.ObjectId},
	lost: String,

	firstName: String,
	lastName: String,
	address: String,
	zip: String,
	city: String,
	country: String,
	phone: String,
	comment: String,

	is_verified: Boolean,
	verification: String,   // le code de verification

	is_reseller: Boolean,
	is_admin: Boolean,

	sponsorCode: String,
	sponsoredCount: {type: Number, 'default': 0},

	created: Date,
	updated: Date,

}, {
	collection: 'user'
})


schema.pre('save', function(next){
	this.updated = new Date()
	if(this.isNew && !this.created) this.created = new Date()
	next()
})

schema.pre('save', function(next) {

	console.log('isModified(passwd) ?', this.isModified('passwd'))

	// only hash the password if it has been modified (or is new)
	if(!this.isModified('passwd')) return next();

	// generate a salt
	const bcrypt = require('bcrypt-nodejs')
	bcrypt.genSalt(10, (err, salt) => {
		if(err) return next(err);

		// hash the password using our new salt
		bcrypt.hash(this.passwd, salt, null, (err, hash) => {
			if(err) return next(err);

			// override the cleartext password with the hashed one
			var old = this.passwd;
			this.passwd = hash;
			console.log('hook pre.save', old, hash);
			next();
		});

	});

});

const model = mongoose.model('User', schema);

module.exports = model