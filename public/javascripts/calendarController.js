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
    var miniNavs = ".mini-month, .mini-week, .mini-year, .mini-option";
    var navButton = ".nav-button"
    var hoverClasses = [miniNavs,navButton].join(', ')

    $calendar.on("mouseover mouseout",hoverClasses, function() {
      $(this).toggleClass('hovered');
    });
    $calendar.on("touch click",miniNavs, function() {
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
    $calendar.on("touch click",navButton, function() {
      var label = this.id;
      view.navAction(label);
    });


  }
  
}();