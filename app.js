require('dotenv').config({silent: true});

const services = require('./services');

services.start(err => {
	if(err) throw err
})