const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList
} = require('graphql')



const Faq = new GraphQLObjectType({
	name: 'Faq',
	fields: () => {

		return {
			_id: { type: GraphQLString },
			question: { type: GraphQLString },
			index: { type: GraphQLInt },
			content: { type: GraphQLString }
		}
	}
})

const SearchFaq = new GraphQLObjectType({
	name: 'SearchFaq',
	fields: {
		total: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		data : { type: new GraphQLList(Faq) }
	}
})


module.exports = {
	Faq,
	SearchFaq
}
