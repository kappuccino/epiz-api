const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList
} = require('graphql')



const Version = new GraphQLObjectType({
	name: 'Version',
	fields: () => {

		return {
			allowed: { type: GraphQLBoolean },
			target: { type: GraphQLString },
			release: { type: GraphQLString }
		}

	}
})


module.exports = {
	Version
}
