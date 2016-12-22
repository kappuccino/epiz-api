const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList
} = require('graphql')


const Story = new GraphQLObjectType({
	name: 'Story',
	fields: ()  => {
		const { Serie } = require('./serie')

		return {
			_id: { type: GraphQLString },
			name: { type: GraphQLString },
			index: { type: GraphQLInt },
			active: { type: GraphQLBoolean },
			free: { type: GraphQLBoolean },

			episodeCount: { type: GraphQLInt, resolve: (_) => episodeCount(_._id)},

			_serie: { type: GraphQLString },
			serie: { type: Serie, resolve: (_, args, root, ast) => getSerie(_._serie) }
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


module.exports = {
	Story,
	SearchStory
}
