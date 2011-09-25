/*globals require, module, __dirname */

// Module dependencies.
var config = require('./config.js'),
  express = require('express'),
  http = require('http'),
  fs = require("fs"),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId,
  imgLog = fs.readFileSync('./public/log.gif'),
  app,
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
  mongoose.connect(config.DATABASE_URL);
});

// Routes

app.get('/', function(req, res) {
  LogEntryModel.find().desc('date').run(function (err, entries) {
    res.render('index', { collection: entries });
  });
});

app.get('/log/', function(req, res) {
  if (req.query.project && req.query.file && req.query.line && req.query.message) {
    console.log(req.query);
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
  }
  res.writeHead(200, {
    'Content-Length': '35',
    'Pragma': 'no-cache',
    'Expires': 'Wed, 19 Apr 2000 11:43:00 GMT',
    'Content-Type': 'image/gif',
    'Cache-Control': 'private, no-cache, no-cache=Set-Cookie, proxy-revalidate'});
  res.end(imgLog, 'binary');
});

app.listen(8080);
console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);

