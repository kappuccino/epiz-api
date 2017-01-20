const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList
} = require('graphql')



const Serie = new GraphQLObjectType({
	name: 'Serie',
	fields: () => {
		const { Story } = require('./story')

		return {
			_id: { type: GraphQLString },
			name: { type: GraphQLString },
			index: { type: GraphQLInt },
			active: { type: GraphQLBoolean },

			storyCount: { type: GraphQLInt, resolve: (_) => storyCount(_._id)},
			episodeCount: { type: GraphQLInt, resolve: (_) => episodeCount(_._id)},

			excerpt: { type: GraphQLString },
			textColor: { type: GraphQLString },
			backgroundColor: { type: GraphQLString },

			stories: {
				type: new GraphQLList(Story),
				args: {
					fromUser: { type: GraphQLBoolean },
					_user: { type: GraphQLString },
					transactions: { type: GraphQLString }
				},
				resolve: (_, args, root, ast) => storiesFromSerie(_._id, args)
			}

		}
	}
})

const SearchSerie = new GraphQLObjectType({
	name: 'SearchSerie',
	fields: {
		total: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		data : { type: new GraphQLList(Serie) }
	}
})

//-- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -

function storyCount(_serie){
	const api = require('../../story/story')

	return api.search({_serie})
		.then(res => res.total)
		.catch(err => console.error(err))
}

function episodeCount(_serie){
	const api = require('../../episode/episode')

	return api.search({_serie})
		.then(res => res.total)
		.catch(err => console.error(err))
}

function storiesFromSerie(_serie, args={}){

	if(args.transactions) args.transactions = JSON.parse(args.transactions) || []

	const api = require('../../story/story')

	return api.search(Object.assign({}, {_serie}, args))
		.then(res => res.data)
		.catch(err => console.error(err))
}


module.exports = {
	Serie,
	SearchSerie
}
