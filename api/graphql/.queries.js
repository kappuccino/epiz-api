const {
	graphql,
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLList
} = require('graphql')

const { Serie, Story } = require('./types')

const getSerie = {
	type: Serie,
	args: {
		_id: { type: GraphQLString },
		limit: { type: GraphQLInt }
	},
	resolve: (obj, {_id}, root, ast) => {

		const serie = require('../serie/serie')
		return serie.getById(_id)

		/*const fields = queryFields(ast);
		 var populate = []
		 if(fields.indexOf('actor') > -1) populate.push('actor')
		 if(fields.indexOf('director') > -1) populate.push('director')
		 populate = populate.length ? populate.join(' ') : false

		 return film.getById(_id, populate)*/
	}
}

const stories = {
	type: new GraphQLList(Story),
	args: {limit: {type: GraphQLInt}},
	resolve: (_, args, root, ast) => {

		queryFields(ast);

		if(!args.limit) return _[ast.fieldName]
		return _[ast.fieldName].slice(0, args.limit)
	}
}



function queryFields(ast){

	var fields = selection(ast.fieldASTs[0].selectionSet.selections)
	if(Array.isArray(fields[0])) fields = fields[0]

	/*console.log('queryFields()')
	 console.log(JSON.stringify(interest, null, 2))*/

	function selection(sel){
		return sel
			.map(x => {

				if(x.kind == 'FragmentSpread'){
					var fragment = ast.fragments[x.name.value]
					return selection(fragment.selectionSet.selections)
				}

				return x.name.value
			})
	}

	return fields
}



module.exports = {
	getSerie
}