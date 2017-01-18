module.exports = function(bus){

	bus.on('userRemoved', (user) => {
		const api = require('./subscription')
		api.removeForUser(user._id)
	})

}

