const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList
} = require('graphql')

const { dateToISO } = require('../util')


const Subscription = new GraphQLObjectType({
	name: 'Subscription',
	fields: ()  => {

		const { User } = require('./user')
		const { Serie } = require('./serie')
		const { Story } = require('./story')
		const { Episode } = require('./episode')
		const { Transaction } = require('./transaction')

		return {
			_id: { type: GraphQLString },
			starts: { type: GraphQLString, resolve: (_, args, root, ast) => dateToISO(_[ast.fieldName]) },
			ends: { type: GraphQLString, resolve: (_, args, root, ast) => dateToISO(_[ast.fieldName]) },

			transactions : { type: new GraphQLList(Transaction) },

			reader: { type: GraphQLString },

			_user: { type: GraphQLString },
			user: { type: User, resolve: (_, args, root, ast) => getUser(_._user) },

			_serie: { type: GraphQLString },
			serie: { type: Serie, resolve: (_, args, root, ast) => getSerie(_._serie) },

			_story: { type: GraphQLString },
			story: { type: Story, resolve: (_, args, root, ast) => getStory(_._story) },

			_episoe: { type: GraphQLString },
			episode: { type: Episode, resolve: (_, args, root, ast) => getEpisode(_._episode) },

			created: { type: GraphQLString, resolve: (_, args, root, ast) => dateToISO(_[ast.fieldName]) },
			updated: { type: GraphQLString, resolve: (_, args, root, ast) => dateToISO(_[ast.fieldName]) }
		}
	}
})

const SearchSubscription = new GraphQLObjectType({
	name: 'SearchSubscription',
	fields: {
		total: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		data : { type: new GraphQLList(Subscription) }
	}
})

const ActiveSubscription = new GraphQLObjectType({
	name: 'ActiveSubscription',
	fields: {
		total: { type: GraphQLInt }
	}
})


function getUser(_id){
	if(!_id) return null
	const api = require('../../user/user')
	return api.getById(_id)
}

function getSerie(_id){
	if(!_id) return null
	const api = require('../../serie/serie')
	return api.getById(_id)
}

function getStory(_id){
	if(!_id) return null
	const api = require('../../story/story')
	return api.getById(_id)
}

function getEpisode(_id){
	if(!_id) return null
	const api = require('../../episode/episode')
	return api.getById(_id)
}




module.exports = {
	Subscription,
	SearchSubscription,
	ActiveSubscription
}
