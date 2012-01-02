/*globals require, module, __dirname */

// Module dependencies.
var express = require('express'),
  http = require('http'),
  fs = require('fs'),
  mongoose = require('mongoose'),
  shSyntaxHighlighter = require(__dirname + '/lib/shCore').SyntaxHighlighter,
  shJScript = require(__dirname + '/lib/shBrushJScript').Brush,
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId,
  imgLog = fs.readFileSync(__dirname + '/public/log.gif'),
  app,
  io,
  LogEntry,
  LogEntryModel;

LogEntry = new Schema({
  date: Date,
  project: String,
  windowLocation: String,
  file: String,
  line: String,
  message: String,
  userAgent: String
});

app = module.exports = express.createServer();
io = require('socket.io').listen(app);
LogEntryModel = mongoose.model('LogEntryModel', LogEntry);

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
  mongoose.connect('mongodb://localhost/logger');
});

app.configure('production', function() {
  app.use(express.errorHandler());
  mongoose.connect(process.env.DATABASE_URL);
});

// Sockets

io.set('log level', 1);
io.sockets.on('connection', function(socket) {
  socket.on('setProjectFilter', function(value) {
    socket.set('projectFilter', value);
  });
});

// Routes

app.get('/', function(req, res) {
  var code = "\n\
    window.onerror = function(message, file, line) {\n\
      new Image().src = 'http://logger.nodester.com/log/'\n\
      + '?project=' + encodeURIComponent('test101')\n\
      + '&amp;windowLocation=' + encodeURIComponent(window.location.protocol + '//' + window.location.host + window.location.pathname)\n\
      + '&amp;file=' + encodeURIComponent(file)\n\
      + '&amp;line=' + encodeURIComponent(line)\n\
      + '&amp;message=' + encodeURIComponent(message);\n\
    };\n\
    ",
    projectFilter = req.query.p || '',
    filters,
    brush = new shJScript();

  if (projectFilter) {
    // Try to use the input as a RegExp, otherwise just treat it as a string
    try {
      filters = { 'project': new RegExp(projectFilter) };
    } catch(e) {
      filters = { 'project': projectFilter };
    }
  }

  brush.init({ toolbar: false });
  LogEntryModel.find(filters).desc('date').run(function (err, entries) {
    res.render('index', {
      example1: brush.getHtml(code),
      collection: entries,
      projectFilter: req.query.p || ''
    });
  });
});

// Add an entry to the error log
app.get('/log/', function(req, res) {
  var logEntry,
    i,
    len,
    clients = io.sockets.clients(),
    pushToClient,
    pushToClientIfListening;

  // Save entry to the database
  if (req.query.project && req.query.file && req.query.line && req.query.message) {
    logEntry = new LogEntryModel({
      date: new Date(),
      project: req.query.project,
      windowLocation: req.query.windowLocation,
      file: req.query.file,
      line: req.query.line,
      message: req.query.message,
      userAgent: req.headers['user-agent']
    });
    logEntry.save(function(err) {
      if (err) { console.log(err); }
    });

    // Push the update to clients who are listening to this project
    pushToClient = function(client) {
      client.emit('update', logEntry);
    };
    pushToClientIfListening = function(client) {
      client.get('projectFilter', function(err, value) {
        if (!value || value === req.query.project) {
          pushToClient(client);
        } else {
          try {
            if (new RegExp(value).test(req.query.project)) {
              pushToClient(client);
            }
          } catch(e) {
            if (req.query.project.indexOf(value) !== -1) {
              pushToClient(client);
            }
          }
        }
      });
    };
    for (i = 0, len = clients.length; i < len; i += 1) {
      pushToClientIfListening(clients[i]);
    }
  }

  // Send a GIF image as a response
  res.writeHead(200, {
    'Content-Length': '35',
    'Pragma': 'no-cache',
    'Expires': 'Wed, 19 Apr 2000 11:43:00 GMT',
    'Content-Type': 'image/gif',
    'Cache-Control': 'private, no-cache, no-cache=Set-Cookie, proxy-revalidate'});
  res.end(imgLog, 'binary');
});

app.listen(13367);
console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);

