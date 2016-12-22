const {
	GraphQLObjectType,
	GraphQLString, GraphQLInt, GraphQLList
} = require('graphql')

const GraphQLJSON = require('graphql-type-json');

const apiStory = require('../story/story')
const apiEpisode = require('../episode/episode')
const apiSerie = require('../serie/serie')
const apiMedia = require('../media/media')

const MediumThumbnail = new GraphQLObjectType({
	name: 'MediumThumbnail',
	fields: {
		_id: { type: GraphQLString },
		name: { type: GraphQLString },
		url: { type: GraphQLString },
		height: { type: GraphQLInt },
		width: { type: GraphQLInt }
	}
})

const MediumProperty = new GraphQLObjectType({
	name: 'MediumProperty',
	fields: {
		_id: { type: GraphQLString },
		key: { type: GraphQLString },
		value: { type: GraphQLJSON }
	}
})

const Medium = new GraphQLObjectType({
	name: 'Medium',
	fields: {
		_id: { type: GraphQLString },
		name: { type: GraphQLString },
		url: { type: GraphQLString },

		thumbnails: {type: new GraphQLList(MediumThumbnail) },
		properties: {type: new GraphQLList(MediumProperty) }
	}
})

const SearchMedia = new GraphQLObjectType({
	name: 'SearchMedia',
	fields: {
		total: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		data : { type: new GraphQLList(Medium) }
	}
})


const Episode = new GraphQLObjectType({
	name: 'Episode',
	fields: {
		_id: { type: GraphQLString },
		name: { type: GraphQLString }
	}
})

const Episodes = {
	type: new GraphQLList(Episode),
	args: {
		_story: {type: GraphQLString}
	},

	resolve: (_, args, root, ast) => {

		/*let fields = queryFields(ast)
		 console.log('args', args, 'fields', fields)*/
		console.log('Story _id', _._id)

		return apiEpisode.getFromStory(_._id)


		//return _[ast.fieldName]

		/*queryFields(ast);

		 if(!args.limit) return _[ast.fieldName]
		 return _[ast.fieldName].slice(0, args.limit)*/
	}
}



const SerieMedium = new GraphQLObjectType({
	name: 'SerieMedium',
	fields: {
		_id: { type: GraphQLString },
		_media: { type: GraphQLString },
		medium: { type: Medium }
	}
})

const Story = new GraphQLObjectType({
	name: 'Story',
	fields: {
		_id: { type: GraphQLString },
		name: { type: GraphQLString },
		_serie: { type: GraphQLString },
		episodes: Episodes
	}
})

const Stories = {
	type: new GraphQLList(Story),
	args: {
		_serie: {type: GraphQLString}
	},

	resolve: (_, args, root, ast) => {

		/*let fields = queryFields(ast)
		console.log('args', args, 'fields', fields)*/
		//console.log('Serie _id', _._id)

		return apiStory.getFromSerie(_._id)


		//return _[ast.fieldName]

		/*queryFields(ast);

		if(!args.limit) return _[ast.fieldName]
		return _[ast.fieldName].slice(0, args.limit)*/
	}
}

const SerieMedia = {
	type: new GraphQLList(SerieMedium),
	resolve: (_, args, root, ast) => {

		const media = _[ast.fieldName]
		if(!media.length) return media

		const _ids = media.map(medium => medium._media)

		return apiMedia.getByIds(_ids)
			.then(allMedia => {
				const list = allMedia.reduce((prev, cur) => {
					prev[cur._id] = cur
					return prev;
				}, {})

				return media.map(medium => {
					if(list[medium._media]) medium.medium = list[medium._media]
					return medium
				})
			})


	}
}




const Serie = new GraphQLObjectType({
	name: 'Serie',
	fields: {
		_id: { type: GraphQLString },
		name: { type: GraphQLString },
		excerpt: { type: GraphQLString },

		media: SerieMedia,

		_poster: { type: GraphQLString },
		poster: {type: Medium, resolve: getPoster},

		totalStories: {
			type: GraphQLInt,
			resolve: (root, args, context, ast) => {
				return apiStory.getFromSerie(root._id)
					.then(series => series.length)
			}
		},

		stories: Stories
	},


	resolve: (_, args, root, ast) => {
		console.log('?????')
	}

})

const Series = {
	type: new GraphQLList(Serie),

	/*resolve: (_, args, root, ast) => {
		//const fields = queryFields(ast)
		//console.log('>>> Series fields', fields)
		return  _[ast.fieldName]
	}*/

}

const SearchSerie = new GraphQLObjectType({
	name: 'SearchSerie',
	fields: {
		total: { type: GraphQLInt },
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt },
		data : Series
	}
})









function getPoster(_, args, root, ast){

	const value = _._poster
	if(!value) return null;

	return apiMedia.getById(value)
}

function getMedia(_, args, root, ast){

	const value = _[ast.fieldName]
	if(!value) return null;

	return apiMedia.getById(value)
}






////////////////////////////////

const searchSerie = {
	type: SearchSerie,
	args: {
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt }
	},
	resolve: (obj, args, root, ast) => {

		const fields = queryFields(ast)
		//console.log('fields', fields)

		return apiSerie.search({
			skip: args.skip,
			limit: args.limit
		})
			/*.then(res => {

				res.data = res.data.map(serie => {
					serie.totalStories = 0
					return serie
				})

				return res
			})*/


			/*.then(res => {
				if(fields.indexOf('stories') == -1) return res

				/!*return story.getFromSerie(serie._id)
					.then(stories => Object.assign({}, serie, {stories}))*!/
			})*/

	}
}

const getSerie = {
	type: Serie,
	args: {
		_id: { type: GraphQLString },
		limit: { type: GraphQLInt }
	},

	resolve: (obj, {_id}, root, ast) => {

		const fields = queryFields(ast)
		//console.log('fields', fields)

		return apiSerie.getById(_id)
			.then(serie => {
				if(fields.indexOf('stories') == -1) return serie

				return apiStory.getFromSerie(serie._id)
					.then(stories => Object.assign({}, serie, {stories}))
			})

	}
}



const searchMedia = {
	type: SearchMedia,
	args: {
		limit: { type: GraphQLInt },
		skip: { type: GraphQLInt }
	},
	resolve: (obj, args, root, ast) => {
		return apiMedia.search({
			skip: args.skip,
			limit: args.limit
		})

	}
}

const getMedium = {
	type: Medium,
	args: {
		_id: { type: GraphQLString }
	},

	resolve: (obj, {_id}, root, ast) => apiMedia.getById(_id)

}


function queryFields(ast){

	var fields = selection(ast.fieldNodes[0].selectionSet.selections)
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
	searchSerie,
	getSerie,

	searchMedia,
	getMedium
}