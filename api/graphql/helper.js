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
	queryFields
}