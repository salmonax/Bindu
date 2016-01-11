var calendarController = function() {
  var $calendar,
      view,
      initialized = false;
  return {
    init: function(page,view) {
      if (!initialized) { 
        $calendar = $(page);
        view = view;
        bindEvents(view);
        initialized = true;
      }
    }
  }
  function bindEvents(view) {
    var navClasses = ".mini-month, .mini-week, .mini-year, .nav-button, .mini-option";
    $calendar.on("mouseover mouseout",navClasses, function() {
      $(this).toggleClass('hovered');
    });
    $calendar.on("touch click",navClasses, function() {
      var buttonClass = '.'+$(this).attr("class").split(' ')[0];
      var index = $(buttonClass).index(this);
      var action = {
        '.mini-month': view.setMonth,
        '.mini-week': view.setWeek,
        '.mini-year': view.setYear,
        '.mini-option': view.setOption
      };
      action[buttonClass](index);
    });
  }
  
}();