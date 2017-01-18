const EventEmitter = require('events').EventEmitter
const bus = new EventEmitter()

require('./serie/event')(bus)
require('./subscription/event')(bus)
require('./user/event')(bus)

module.exports = bus