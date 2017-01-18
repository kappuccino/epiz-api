module.exports = function(bus){

	const updateStoryReading = (data) => {
		const _serie = data._serie;
		if(!_serie) return;

		//console.log('-- Serie ', data._serie)

		const api = require('./serie')
		api.generateAllReading()
			.catch(err => {})
	}

	bus.on('storyCreated', (story) => {
		//console.log('storyCreated')
		updateStoryReading(story)
	})

	bus.on('storyUpdated', (story) => {
		//console.log('storyUpdated')
		updateStoryReading(story)
	})

	bus.on('storyRemoved', (story) => {
		//console.log('storyRemoved')
		updateStoryReading(story)
	})




	bus.on('episodeCreated', (episode) => {
		//console.log('episodeCreated')
		updateStoryReading(episode)
	})

	bus.on('episodeUpdated', (episode) => {
		//console.log('episodeUpdated')
		updateStoryReading(episode)
	})

	bus.on('episodeRemoved', (episode) => {
		//console.log('episodeRemoved')
		updateStoryReading(episode)
	})

}

