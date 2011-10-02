/*global Modernizr, io */

var logger = (function(module) {
  var socket = io.connect('http://logger.nodester.com'),
    $logs = $('#logs tbody'),
    introVisible = true,
    $intro = $('#introduction'),
    $toggleIntro = $('#toggleIntro');

  // Retrieve previous state of the introduction
  if (Modernizr.localstorage && typeof localStorage.introVisible !== 'undefined') {
    introVisible = (localStorage.introVisible === 'true' ? true : false);
  }
  if (introVisible) {
    $intro.show();
    $toggleIntro.text('Hide introduction');
  } else {
    $intro.hide();
    $toggleIntro.text('Show introduction');
  }

  // Update the log list when we get a web socket
  socket.on('update', function (entry) {
    var $row = $('<tr><td>' + entry.date.toString() + '</td><td>' + entry.project + '</td><td>' + entry.windowLocation + '</td><td>' + entry.file + '</td><td>' + entry.line + '</td><td>' + entry.message + '</td><td>' + entry.userAgent + '</td></tr>');
    $logs.prepend($row);
  });

  $toggleIntro.click(function(e) {
    e.preventDefault();
    if (introVisible) {
      introVisible = false;
      $intro.slideUp();
      $toggleIntro.text('Show introduction');
    } else {
      introVisible = true;
      $intro.slideDown();
      $toggleIntro.text('Hide introduction');
    }
    if (Modernizr.localstorage) {
      localStorage.introVisible = introVisible;
    }
  });

  return module;
}(logger || {}));

