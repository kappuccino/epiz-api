const EventEmitter = require('events').EventEmitter

var bus = new EventEmitter()

require('./user/event')(bus)

module.exports = bus