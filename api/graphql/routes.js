const {	graphql } = require('graphql')
const graphqlHTTP = require('express-graphql')

const schema = require('./schema')

module.exports = function(router){

	router.use('/graphql', graphqlHTTP({
		schema,
		graphiql: true
	}));

};
