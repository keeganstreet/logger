/*global Modernizr, io, history */

var logger = (function(module) {
  var socket,
    $logs = $('#logs'),
    introVisible = true,
    $intro = $('#introduction'),
    $toggleIntro = $('#toggleIntro'),
    $formFilter = $('#formFilter'),
    $inputFilter = $('#inputFilter'),
    timeOfLastFilterAjax;

  // Retrieve previous state of the introduction
  if (Modernizr.localstorage && typeof localStorage.introVisible !== 'undefined') {
    introVisible = (localStorage.introVisible === 'true' ? true : false);
  }
  if (introVisible) {
    $intro.show();
    $toggleIntro.removeClass('show').addClass('hide');
  } else {
    $intro.hide();
    $toggleIntro.removeClass('hide').addClass('show');
  }

  // Update the log list when we get a web socket
  if (Modernizr.websockets) {
    socket = io.connect('http://logger.nodester.com');
    socket.on('update', function (entry) {
      var $log = $('<div class="log clearfix"></div>')
        .append($('<div class="logSummary"><h2>' + entry.project + '</h2><p>' + entry.date.toString() + '</p></div>'))
        .append($('<div class="logDetails"><div class="detail detailWindowLocation"><a href="' + encodeURI(entry.windowLocation) + '" target="_blank">' + entry.windowLocation + '</a></div><div class="detail detailFile">' + entry.file + ' line ' + entry.line + '</div><div class="detail detailMessage">' + entry.message + '</div><div class="detail detailUserAgent"><a href="http://www.tera-wurfl.com/explore/index.php?ua=' + encodeURIComponent(entry.userAgent) + '" target="_blank">' + entry.userAgent + '</a></div></div>'));
      $logs.prepend($log);
    });
  }

  // Show/hide the introduction
  $toggleIntro.click(function(e) {
    e.preventDefault();
    if (introVisible) {
      introVisible = false;
      $intro.slideUp();
      $toggleIntro.removeClass('hide').addClass('show');
    } else {
      introVisible = true;
      $intro.slideDown();
      $toggleIntro.removeClass('show').addClass('hide');
    }
    if (Modernizr.localstorage) {
      localStorage.introVisible = introVisible;
    }
  });

  // Use Ajax for project filtering
  if (Modernizr.history) {
    $inputFilter.keyup(function(e) {
      $formFilter.submit();
    });
    $formFilter.submit(function(e) {
      e.preventDefault();
      var newUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname,
        val = $inputFilter.val(),
        timeOfThisFilterAjax;

      if (val !== '') {
        newUrl += '?p=' + encodeURIComponent(val);
      }

      timeOfThisFilterAjax = timeOfLastFilterAjax = new Date();
      $.get($formFilter.attr('action'), $formFilter.serialize(), function(data) {
        var $newPage;
        // Only process this reponse if it is the most recent Ajax request
        if (timeOfThisFilterAjax === timeOfLastFilterAjax) {
          $newPage = $(data);
          $logs.empty().append($(data).find('.log'));
        }
      });

      history.pushState(null, null, newUrl);
    });
  }

  return module;
}(logger || {}));

