const {	graphql } = require('graphql')
const graphqlHTTP = require('express-graphql')

const schema = require('./schema')

module.exports = function(router){

	router.use('/graphql', (req, res, next) => {

		console.log(req.body.variables)
		console.log(req.body.query)
		next()

	});

	router.use('/graphql', graphqlHTTP({
		schema,
		graphiql: true
	}));

};
