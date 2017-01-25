var server, app

function start(cb){

	const express = require('express')
	app = express()

	app.disable('x-powered-by')

	app.set('port', process.env.PORT_HTTPS || process.env.PORT)
	app.set('env', process.env.NODE_ENV == 'production' ? 'production' : 'development')

	// Gzip
	const compress = require('compression')
	app.use(compress())

	// Check auth header
	//const auth = require('./api/auth')
	//app.use(auth(app))

	// Log strategy
	const logger = require('morgan')
	//if('dev' == app.get('env')){
		app.use(logger('dev', {

			skip: (req, res) => {
				if(req.originalUrl.match(/\/client\//)) return true
				//return res.statusCode < 400
			}

		}))
	//}

	const bodyParser = require('body-parser')
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }))

	app.use(function (req, res, next){
		res.header("Access-Control-Allow-Origin",  "*")
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Auth")
		res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, OPTIONS")

		// intercept OPTIONS method
		if('OPTIONS' == req.method) return res.sendStatus(200)

		next()
	})

	const router = express.Router()

	router.get('/', function search(req, res){
		res.send(`
  -- Epiz, stories for kids -----------------

	                    /
	               ,.. /
	             ,'   ';
	  ,,.__    _,' /';  .
	 :','  ~~~~    '. '~
	:' (   )         )::,
	'. '. .=----=..-~  .;'
	 '  ;'  ::   ':.  '"
	   (:   ':    ;)
	    \\   '"  ./
	     '"      '"`)
	})


	require('./api/user/routes')(app)
	require('./api/serie/routes')(app)
	require('./api/story/routes')(app)
	require('./api/episode/routes')(app)
	require('./api/media/routes')(app)
	require('./api/subscription/routes')(app)
	require('./api/transaction/routes')(app)
	require('./api/faq/routes')(app)
	require('./api/announcement/routes')(app)
	require('./api/plan/routes')(app)
	require('./api/cron/routes')(app)

	// GraphQL
	require('./api/graphql/routes')(app);

	// Dev only
	const errorHandler = require('errorhandler')
	//if ('development' == app.get('env')) {
		app.use(errorHandler())
	//}

	// mount the router on the app
	app.use('/', router)

	app.listen = function(port, cb){

		// HTTPS
		if(process.env.EPIZ_SSL_KEY) {
			const https = require('https')
			const fs = require('fs')

			const options = {
				key: fs.readFileSync(process.env.EPIZ_SSL_KEY),
				cert: fs.readFileSync(process.env.EPIZ_SSL_CERT)
			}

			const server = https.createServer(options, this)
			return server.listen.apply(server, [port, cb]);

		}

		// HTTPS
		else{
			const http = require('http')
			const server = http.createServer(this)
			return server.listen.apply(server, [port, cb]);
		}

	};

	// Let's go
	server = app.listen(app.get('port'), function(){
		cb(null, `express listening on port ${app.get('port')}`)
	})

}

function stop(cb){
	server.close()
	if(cb) cb(null, server)
}


module.exports = {
	start,
	stop
}