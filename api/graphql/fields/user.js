const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList
} = require('graphql')

const { dateToISO } = require('../util')


const User = new GraphQLObjectType({
	name: 'User',
	fields: ()  => {
		return {
			_id: { type: GraphQLString },
			login: { type: GraphQLString },
			firstName: { type: GraphQLString },
			lastName: { type: GraphQLString },
			is_verified: { type: GraphQLBoolean },
			is_reseller: { type: GraphQLBoolean },

			activeSubscriptionCount: { type: GraphQLInt, resolve: (_, args, root, ast) => activeSubscriptionCount(_._id) },

			created: { type: GraphQLString, resolve: (_, args, root, ast) => dateToISO(_[ast.fieldName]) },
			updated: { type: GraphQLString, resolve: (_, args, root, ast) => dateToISO(_[ast.fieldName]) }
		}
	}
})

const SearchUser= new GraphQLObjectType({
	name: 'SearchUser',
	fields: {
		total: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		data : { type: new GraphQLList(User) }
	}
})

function activeSubscriptionCount(_user){
	const api = require('../../subscription/subscription')

	return api.search({fromUser:true, _user})
		.then(res => res.total)
}




module.exports = {
	User,
	SearchUser
}
