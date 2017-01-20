const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList
} = require('graphql')


const Story = new GraphQLObjectType({
	name: 'Story',
	fields: ()  => {
		const { Serie } = require('./serie')
		const { Episode } = require('./episode')

		return {
			_id: { type: GraphQLString },
			name: { type: GraphQLString },
			excerpt: { type: GraphQLString },
			index: { type: GraphQLInt },
			active: { type: GraphQLBoolean },
			is_free: { type: GraphQLBoolean },

			episodeCount: { type: GraphQLInt, resolve: (_) => episodeCount(_._id)},

			_serie: { type: GraphQLString },
			serie: { type: Serie, resolve: (_, args, root, ast) => getSerie(_._serie) },

			episodes: {
				type: new GraphQLList(Episode),
				args: {
					fromUser: { type: GraphQLBoolean },
					_user: { type: GraphQLString },
					transactions: { type: GraphQLString }
				},
				resolve: (_, args, root, ast) => episodesFromStory(_._id, args)
			}
		}
	}
})

const SearchStory = new GraphQLObjectType({
	name: 'SearchStory',
	fields: {
		total: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		data : { type: new GraphQLList(Story) }
	}
})

//-- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -- -- --- -

function episodeCount(_story){
	const api = require('../../episode/episode')

	return api.search({_story})
		.then(res => res.total)
		.catch(err => console.error(err))
}

function getSerie(_serie){
	const api = require('../../serie/serie')
	return api.getById(_serie)
}

function episodesFromStory(_story, args={}){
	const api = require('../../episode/episode')

	if(args.transactions) args.transactions = JSON.parse(args.transactions) || []

	return api.search(Object.assign({}, {_story}, args))
		.then(res => res.data)
		.catch(err => console.error(err))
}



module.exports = {
	Story,
	SearchStory
}
