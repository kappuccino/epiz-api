function timestamp(date) {
	let ts

	try {
		const d = new Date(date)
		ts = d.getTime().toString()
	} catch (e) {}

	return ts
}

function dateToISO(d){

	if(!d) return null

	const moment = require('moment')
	let iso

	if(! d instanceof Date) return ''


	const timestamp = d.getTime()

	// https://forums.meteor.com/t/how-to-deal-with-user-input-of-dates-using-isodate-stored-to-mongo-db/6603/6
	// ?
	const date = moment.utc(timestamp).format('YYYY-MM-DD HH:mm:ss')

	//console.log(date)
	return date

	/*

	 console.log(date, time)


	 try {
	 iso = moment(date).format('YYYY-MM-DD HH:mm:ss')
	 } catch (e) {}

	 */

	return iso
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
	timestamp,
	dateToISO,
	queryFields
}