const { GraphQLSchema, GraphQLObjectType } = require('graphql')

const fields = require('./root-fields')

module.exports = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'RootQueryType',
		fields
	})
})