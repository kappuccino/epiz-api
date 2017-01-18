module.exports = function(bus){

	function mailchimpVerified(data){

		const user = require('./user')

		user.mailchimpUpsert(data, {
			'VERIFIED': data.is_verified ? 'YES' : 'NO'
		})
			.then(res => console.log(res))
			.catch(err => console.log(err))
	}

	// Update mailchimp user according to the is_verified status
	bus.on('userCreated', (data) => mailchimpVerified(data))
	bus.on('userUpdated', (data) => mailchimpVerified(data))



	// If sponsor, update the sponsoredCount
	bus.on('userCreated', (user) => {
		const sponsor = user._sponsor
		if(!sponsor) return false

		const model = require('./model')

		model.update({_id: sponsor}, {$inc: {sponsoredCount: 1}}).exec()
	})

	// If sponsor, update the sponsoredCount
	bus.on('userRemoved', (user) => {
		const sponsor = user._sponsor
		if(!sponsor) return false

		const model = require('./model')

		model.update({_id: sponsor}, {$inc: {sponsoredCount: -1}}).exec()
	})



}

