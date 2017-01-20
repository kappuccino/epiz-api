const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLList, GraphQLBoolean
} = require('graphql')

const { SearchFaq, Faq } = require('./fields/faq')
const { SearchSerie, Serie } = require('./fields/serie')
const { SearchStory, Story } = require('./fields/story')
const { SearchEpisode, Episode } = require('./fields/episode')
const { SearchUser, User } = require('./fields/user')
const { SearchSubscription, Subscription, ActiveSubscription } = require('./fields/subscription')
const { SearchTransaction, Transaction, StatsTransaction } = require('./fields/transaction')

////////////////////////////////

const searchFaq = {
	type: SearchFaq,
	args: {
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		question: { type: GraphQLString }
	},
	resolve: (obj, args, root, ast) => {
		const faqAPI = require('../faq/faq')
		return faqAPI.search(args)

	}
}

const getFaq = {
	type: Faq,
	args: {
		_id: { type: GraphQLString }
	},
	resolve: (obj, {_id}, root, ast) => {
		const faqAPI = require('../faq/faq')
		return faqAPI.getById(_id)
	}
}



const searchSerie = {
	type: SearchSerie,
	args: {
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		name: { type: GraphQLString },
		_user: { type: GraphQLString }
	},
	resolve: (obj, args, root, ast) => {
		const serieAPI = require('../serie/serie')
		return serieAPI.search(args)

		/*.then(res => {

			res.data = res.data.map(serie => {
				serie.totalStories = 0
				return serie
			})

			return res
		})*/

		/*.then(res => {
			if(fields.indexOf('stories') == -1) return res

			/!*return story.getFromSerie(serie._id)
				.then(stories => Object.assign({}, serie, {stories}))*!/
		})*/

	}
}

const getSerie = {
	type: Serie,
	args: {
		_id: { type: GraphQLString }
	},
	resolve: (obj, {_id}, root, ast) => {
		const storyAPI = require('../serie/serie')
		return storyAPI.getById(_id)
	}
}



const searchStory = {
	type: SearchStory,
	args: {
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		name: { type: GraphQLString },
		_serie: { type: GraphQLString }
	},
	resolve: (obj, args, root, ast) => {
		const storyAPI = require('../story/story')
		return storyAPI.search(args)
	}
}

const getStory = {
	type: Story,
	args: {
		_id: { type: GraphQLString }
	},
	resolve: (obj, {_id}, root, ast) => {
		const api = require('../story/story')
		return api.getById(_id)
	}
}



const searchEpisode = {
	type: SearchEpisode,
	args: {
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		name: { type: GraphQLString },
		_serie: { type: GraphQLString },
		_story: { type: GraphQLString }
	},
	resolve: (obj, args, root, ast) => {
		const api = require('../episode/episode')
		return api.search(args)
	}
}

const getEpisode = {
	type: Episode,
	args: {
		_id: { type: GraphQLString }
	},
	resolve: (obj, {_id}, root, ast) => {
		const api = require('../episode/episode')
		return api.getById(_id)
	}
}



const searchUser = {
	type: SearchUser,
	args: {
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		login: { type: GraphQLString }
	},
	resolve: (obj, args, root, ast) => {
		const api = require('../user/user')
		return api.search(args)
	}
}

const getUser = {
	type: User,
	args: {
		_id: { type: GraphQLString }
	},
	resolve: (obj, {_id}, root, ast) => {
		const api = require('../user/user')
		return api.getById(_id)
	}
}




const searchSubscription = {
	type: SearchSubscription,
	args: {
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		starts: { type: GraphQLString },
		ends: { type: GraphQLString },
		fromUser: { type: GraphQLBoolean },
		_user: { type: GraphQLString },
		transactions: { type: GraphQLString }
	},
	resolve: (obj, args, root, ast) => {
		const api = require('../subscription/subscription')
		if(args.transactions){
			args['transactions.ref'] = JSON.parse(args.transactions) || []
			delete args.transactions
		}

		return api.search(args)
	}
}

const activeSubscription = {
	type: ActiveSubscription,
	resolve: () => {
		const api = require('../subscription/subscription')
		return api.active()
	}
}

const getSubscription = {
	type: Subscription,
	args: {
		_id: { type: GraphQLString }
	},
	resolve: (obj, {_id}, root, ast) => {
		const api = require('../subscription/subscription')
		return api.getById(_id)
	}
}



const searchTransaction = {
	type: SearchTransaction,
	args: {
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		_user: { type: GraphQLString },
		id_subscription: { type: GraphQLString },
		platform: { type: GraphQLString },
		from: { type: GraphQLString },
		to: { type: GraphQLString }
	},
	resolve: (obj, args, root, ast) => {
		const api = require('../transaction/transaction')
		return api.search(args)
	}
}

const statsTransaction = {
	type: StatsTransaction,
	args: {
		days: { type: GraphQLInt }
	},
	resolve: (obj, args, root, ast) => {
		const api = require('../transaction/transaction')
		return api.stats(args)
	}
}

const getTransaction = {
	type: Transaction,
	args: {
		_id: { type: GraphQLString }
	},
	resolve: (obj, {_id}, root, ast) => {
		const api = require('../transaction/transaction')
		return api.getById(_id)
	}
}



module.exports = {
	searchFaq,
	getFaq,

	searchSerie,
	getSerie,

	searchStory,
	getStory,

	searchEpisode,
	getEpisode,

	searchUser,
	getUser,

	searchSubscription,
	getSubscription,
	activeSubscription,

	searchTransaction,
	getTransaction,
	statsTransaction

}