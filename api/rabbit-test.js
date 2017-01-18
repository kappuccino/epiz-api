require('dotenv').config({silent: true});

require('./rabbit').publish(
	'test',
	{'name': 'unicorn'}
)