var logger = (function(module) {
  var socket = io.connect('http://logger.nodester.com'),
    $logs = $('#logs tbody');

  socket.on('update', function (entry) {
    console.log(entry);
    var $row = $('<tr><td>' + entry.date.toString() + '</td><td>' + entry.project + '</td><td>' + entry.windowLocation + '</td><td>' + entry.file + '</td><td>' + entry.line + '</td><td>' + entry.message + '</td><td>' + entry.userAgent + '</td></tr>');
    $logs.prepend($row);
  });

  return module;
}(logger || {}));

