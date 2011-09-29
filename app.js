/*globals require, module, __dirname */

/* This app used to be hosted at DotCloud.
 * We have moved it to Nodester for socket.io support.
 * The MongoDB database is still hosted with DotCloud.
 */

// Module dependencies.
var express = require('express'),
  http = require('http'),
  app;

app = module.exports = express.createServer();

// Configuration

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res) {
  res.writeHead(302, {
	'Location': 'http://logger.nodester.com/'
  });
  res.end();
});

app.listen(8080);
console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);

