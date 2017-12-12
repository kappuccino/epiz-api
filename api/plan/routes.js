const tools = require('../tools')

module.exports = function(router){



	router.get('/plan', function search(req, res, next){

		const plans = [
			{
				"name": "1 mois (28 épisodes)",
				"inappkey": "oneMonth_ns",
				"days": "28",
				"price": 2.99,
				"gift": false,
				"platform": "ios"
			},
			/*{
				"name": "1 an (364 épisodes)",
				"inappkey": "oneYear_ns",
				"days": "365",
				"price": 29.99,
				"gift": false,
				"platform": "ios"
			},*/
			{
				"name": "1 mois (28 épisodes)",
				"inappkey": "fr.epiz.28",
				"days": "28",
				"price": 2.99,
				"gift": false,
				"platform": "android"
			},
			/*{
				"name": "1 an (364 épisodes)",
				"inappkey": "fr.epiz.365",
				"days": "365",
				"price": 29.99,
				"gift": true,
				"platform": "android"
			}*/
		]

		tools.requestSuccess(plans, req, res)

	})




}

