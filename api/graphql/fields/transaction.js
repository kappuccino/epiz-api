const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList
} = require('graphql')

const { dateToISO } = require('../util')


const Transaction = new GraphQLObjectType({
	name: 'Transaction',
	fields: () => {
		const { Subscription } = require('./subscription')

		return {
			_id: {type: GraphQLString},
			date: {type: GraphQLString, resolve: (_, args, root, ast) => dateToISO(_[ast.fieldName])},
			ref: {type: GraphQLString},
			platform: {type: GraphQLString},
			amount: {type: GraphQLFloat},
			duration: {type: GraphQLInt},
			type: {type: GraphQLString},
			subscription: {type: Subscription, resolve: (_, args, root, ast) => getSubscription(_._id)}
		}
	}
})

const SearchTransaction = new GraphQLObjectType({
	name: 'SearchTransaction',
	fields: {
		total: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		data : { type: new GraphQLList(Transaction) }
	}
})

function getSubscription(_id){
	const api = require('../../subscription/subscription')
	return api.getFromTransactionId(_id)
}

module.exports = {
	Transaction,
	SearchTransaction
}
