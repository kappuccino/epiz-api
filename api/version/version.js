function check(platform, release){

	const compare = require('compare-versions')
	const pack = require('../../package.json')

	const target = pack.mobile_version[platform] || '0.0.0'
	const delta = compare(target, release)

	return Promise.resolve({
		target,
		release,
		allowed: delta <= 0
	})

}



module.exports = {
	check
}