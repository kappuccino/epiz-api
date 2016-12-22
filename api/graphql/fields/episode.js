const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList
} = require('graphql')


const Episode = new GraphQLObjectType({
	name: 'Episode',
	fields: ()  => {
		const { Serie } = require('./serie')
		const { Story } = require('./story')

		return {
			_id: { type: GraphQLString },
			name: { type: GraphQLString },
			index: { type: GraphQLInt },
			content: { type: GraphQLString },

			_serie: { type: GraphQLString },
			serie: { type: Serie, resolve: (_, args, root, ast) => getSerie(_._serie) },

			_story: { type: GraphQLString },
			story: { type: Story, resolve: (_, args, root, ast) => getStory(_._story) },

		}
	}
})

const SearchEpisode = new GraphQLObjectType({
	name: 'SearchEpisode',
	fields: {
		total: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		data : { type: new GraphQLList(Episode) }
	}
})




function getSerie(_serie){
	const api = require('../../serie/serie')
	return api.getById(_serie)
}

function getStory(_story){
	const api = require('../../story/story')
	return api.getById(_story)
}


module.exports = {
	Episode,
	SearchEpisode
}
