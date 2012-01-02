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
    ";

  var brush = new shJScript();
  brush.init({ toolbar: false });
  LogEntryModel.find().desc('date').run(function (err, entries) {
    res.render('index', {
      example1: brush.getHtml(code),
      collection: entries
    });
  });
});

app.get('/log/', function(req, res) {
  if (req.query.project && req.query.file && req.query.line && req.query.message) {
    var logEntry = new LogEntryModel({
      date: new Date(),
      project: req.query.project,
      windowLocation: req.query.windowLocation,
      file: req.query.file,
      line: req.query.line,
      message: req.query.message,
      userAgent: req.headers['user-agent']
    });
    logEntry.save(function(err){
      if (err) { console.log(err); }
    });
    io.sockets.emit('update', logEntry);
  }
  res.writeHead(200, {
    'Content-Length': '35',
    'Pragma': 'no-cache',
    'Expires': 'Wed, 19 Apr 2000 11:43:00 GMT',
    'Content-Type': 'image/gif',
    'Cache-Control': 'private, no-cache, no-cache=Set-Cookie, proxy-revalidate'});
  res.end(imgLog, 'binary');
});

app.listen(12118);
console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);

