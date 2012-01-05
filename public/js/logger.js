/*global Modernizr, io, history */

var logger = (function(module) {
  var socket = io.connect('http://logger.nodester.com'),
    $logs = $('#logs'),
    $formFilter = $('#formFilter'),
    $inputFilter = $('#inputFilter'),
    timeOfLastFilterAjax;

  // Show/hide the introduction
  (function() {
    var introVisible = true,
      $intro = $('#introduction'),
      $toggleIntro = $('#toggleIntro');

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
  }());

  // Send the initial filter state to the web socket server
  (function() {
    var search = window.location.search,
      regex = /p=([^&]+)/,
      matches;
    if (search && regex.test(search)) {
      matches = search.match(regex);
      socket.emit('setProjectFilter', matches[1]);
    }
  }());

  // Update the log list when we get an update via web sockets
  socket.on('update', function (entry) {
    var date = new Date(entry.date),
      $log = $('<div class="log clearfix newLog"></div>')
        .append($('<div class="logSummary"><h2>' + entry.project + '</h2><p>' + date.toDateString() + ' ' + date.toLocaleTimeString() + '</p></div>'))
        .append($('<div class="logDetails"><div class="detail detailWindowLocation"><a href="' + encodeURI(entry.windowLocation) + '" target="_blank">' + entry.windowLocation + '</a></div><div class="detail detailFile">' + entry.file + ' line ' + entry.line + '</div><div class="detail detailMessage">' + entry.message + '</div><div class="detail detailUserAgent"><a href="http://www.tera-wurfl.com/explore/index.php?ua=' + encodeURIComponent(entry.userAgent) + '" target="_blank">' + entry.userAgent + '</a></div></div>'));
    $logs.prepend($log);

    $(window).on('focus', function(e) {
      $(window).off('focus');
      $logs.find('.newLog').removeClass('newLog');
    });
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

      // Filter the existing log items on the page immediately, while waiting on the Ajax response
      $logs.find('.log').filter(function(index) {
        var logItemProjectName = $(this).find('h2').text();
        try {
          if (new RegExp(val).test(logItemProjectName)) {
            return false;
          }
        } catch(e) {
          if (logItemProjectName.indexOf(val) !== -1) {
            return false;
          }
        }
        return true;
      }).hide();

      if (val !== '') {
        newUrl += '?p=' + encodeURIComponent(val);
      }

      // Tell the server to only send us web sockets for this project
      socket.emit('setProjectFilter', val);

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

