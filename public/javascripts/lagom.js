var Filter = function(title,parsley) {
  this.title = title
  this.parsley = parsley;
}

Filter.prototype = {
  render: function render(container) {

  },
  populate: function populate(items) {

  }
}

var filterTitles = "date time category description duration".split(' ');



var lastYear = $.get('/2015');
var thisYear = $.get('/2014');

$.when(lastYear,thisYear).done(function (lastYear,thisYear) {
  var data = lastYear[0] + "\n" + thisYear[0];

// $.get("/2015",function (data) {

  var parsley = buildData(data);
  //This is... iffy. Not sure where to put it yet:
  var parsleyColors = generateParsleyColors(parsley,"category");

  var filters = "year month week tag category subcategory".split(' ');
  // p(parsley);
  var selectionObject = {}

  var currentDate = new Date();

  
  //DELETE!
  // currentDate.setDate(currentDate.getDate()-1);


  renderCalendar();

  loadPomsheet(data);
  renderFilters();

 

  // p(parsley.tasks);


  $(".filter").mouseup(function() {
    var selection = [];
    var key = this.id.replace('-filter','');
    $('#'+this.id).children('option:selected').each(function() {
      //this assumes that a count is placed after the item text
      var itemText = $(this).text().replace(/\s\(\d+\)$/,'');
      selection.push(itemText);
    });

    
    var parentFilters = filters.slice(0,filters.indexOf(key)+1);

    clearSelectionObject(parentFilters);
    selectionObject[key] = selection;

    //TODO: make filtered return a parsley object, get rid of updateStats()
    var filtered = filterParsleyBySelectionObject();
    var stats = createFilteredStats(filtered);
    // p(stats);

    // var filtered = filterParsleyBy(key,selection);
    // linesFromFiltered(filtered);

    // r(parentFilters);
    // p(selectionObject);

    // filterParlseyBySelectionObject();

    clearFilters(parentFilters);
    populateFilters(filtered,parentFilters,stats);

  });

  function generateParsleyColors(parsley,property) { 
    var colors = {}
    var stats = Object.keys(parsley.stats[property]);
    var seed;
    // var seed = stats.reduce( function(sum,stat) { 
    //   return sum + stat.charCodeAt(0);
    // },0);
    // seed = 1;

    // p(seed);
    // p(seeded());
    // p(seeded());

    stats.forEach( function(stat) { 
      // sums the ascii values of each character in the stat to use as seed
      var charSum = stat.split('').reduce( function(sum,item,i) { return sum + item.charCodeAt()*i+2 },0);
      seed = charSum;

      var color = {
        r: parseInt(seededRandom()*100+50),
        g: parseInt(seededRandom()*100+50),
        b: parseInt(seededRandom()*100+100)
      }
      var colorString = "rgb("+color.r+','+color.g+','+color.b+")";

      colors[stat] = colorString;

      // $("#output").append('<div style="background:'+colorString+'">'+stat+' '+colorString+' '+charSum+'</div>');
    });
    return colors;

    function seededRandom() {
      var x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }

  }

  function renderCalendar(startDate) {
    // var $calendar = $("#pomsheet");
    $("#calendar").append(div("cal-heading",true));
    var labels = "year week month day".split(' ');
    // $calendar.append(div("cal-heading",true));
    $("#cal-heading").append(div(labels,false,"label"));
    $("#calendar").append(div("cal-nav",true))
    $("#calendar").append(div("cal-body",true));

    // div("previous");
    var startDate = startDate || weekOf(currentDate);

    renderWeek(startDate,8);
    setStyles();

    function setStyles() {
      var base = "rgb(50,50,100)";
      var veryDark = "rgb(25,25,50)";
      var veryLight = "rgb(100,100,200)";
      var gridLighter = "rgb(40,40,90)"
      var gridDarker = "rgb(35,35,85)"

      $("#cal-heading").css({
        boxSizing: "border-box",
        height: "30px",
        paddingTop: "5px",
        paddingLeft: "5px",
        background: veryDark,
        overflow: "auto"
      });
      $("#calendar").css({
        // display: "flex",
        // flexFlow: "column"
        // position: "absolute",
        top: "0px",
        bottom: "0px",
        left: "0px",
        right: "0px",
        background: base,
        overflow: "auto"
      });
      $("#week-title").css({
        float: "left"
      });
      $("#mini-year-nav").css({
        display: "flex",
        flexGrow: "2",
        float: "left",
        background: gridDarker
      });
      $(".mini-month").css({
        alignSelf: "center",
        fontSize: "10px",
        flexGrow: "2",
        // float: "left",
        marginRight: "1px",
        background: base,
        height: "80%"
      });
      $(".mini-month:nth-child(4n)").css({
        marginRight: "5px"
      });
      $(".mini-month:first").css({
        marginLeft: "5px"
      });
      $("#mini-month-nav").css({
        display: "flex",
        flexGrow: "0.5",
        background: gridDarker
      });
      $(".mini-week").css({
        alignSelf: "center",
        marginRight: "1px",
        flexGrow: "2",
        background: base,
        height: "80%"
      });
      $(".mini-week:first").css({
        marginLeft: "3px"
      })
      $(".mini-week:last").css({
        marginRight: "3px"
      })
      $(".label").css({
        float: "left",
        padding: "3px 10px",
        margin: "0 1px",
        background: base
      });
      $("#cal-nav").css({
        display: "flex",
        // background: "red",
        background: gridDarker,
        overflow: "auto"
      });
      $(".nav-button").css({
        padding: "0px 5px",
        textAlign: "center",
        margin: "1px",
        minWidth: "20px",
        background: veryLight,
        float: "right"
      })
      $("#cal-body").css({
        // marginTop: "30px",
        boxSizing: "border-box",
        // position: "absolute",
        // background: "red",
        margin: "10px",
        display: "flex",
        flexFlow: "row",
        top: "0px",
        bottom: "0px",
        left: "0px",
        right: "0px",
        // height: "100%",
        // overflow: "auto"
      })
      $(".week-column").css({
        // position: "relative",
        boxSizing: "border-box",
        display: "flex",
        flexFlow: "column",
        flexGrow: "2",
        height: "100%",
        borderStyle: "dotted",
        borderColor: veryLight,
        borderWidth: "1px 1px 1px 0px",
      });
      $(".week-column:first").css({
        borderWidth: "1px 1px 1px 1px"
      })
      $(".day-heading").css({
        // background: "blue",
        textAlign: "center"
      });
      $(".day-tasks").css({
        // opacity: 0.6,
        fontSize: "11px",
        position: "relative",
        height: "100%",
        // background: "orange",
        overflow: "hidden"
      });
      $(".task").css({
        // fontSize: "11px",
        boxSizing: "border-box",
        paddingTop: "1px",
        paddingRight: "18px",
        margin: "0px 0px 1px 18px",
        textAlign: "center",
        position: "absolute",
        // background: "green",
        width: "100%"
      });
      $(".day-row").css({

        paddingLeft: "3px",
        lineHeight: "16px"
      });
      $(".week-column:nth-child(even) .day-row:nth-child(odd)").css({
        background: gridDarker
      });
      
      $(".week-column:nth-child(even) .day-row:nth-child(even)").css({
        background: gridLighter,
      //   borderStyle: "dotted",
      //   borderWidth: "0px 0px 1px 0px",
      //   borderColor: veryLight
      });
      $(".week-column:nth-child(odd) .day-row:nth-child(even)").css({
        background: gridDarker,
        // borderStyle: "dotted",
        // borderWidth: "0px 0px 1px 0px",
        // borderColor: veryLight
      });
      $(".week-column:nth-child(odd) .day-row:nth-child(odd)").css({
        background: gridLighter
      });
    }

    function weekOf(date) {
      var day = date.getDate();
      var startDay = 7*Math.floor((day-1)/7)+1;
      var copiedDate = new Date(date.getTime());
      copiedDate.setDate(startDay);
      copiedDate.setHours(0);
      copiedDate.setMinutes(0);
      copiedDate.setSeconds(0);
      copiedDate.setMilliseconds(0);
      return copiedDate;
    }

    function dayName(num) {
      return "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(' ')[num];
    }

    function div(labelArray,noTitle,className) {
      var html = '';
      if (!(labelArray instanceof Array)) {
        labelArray = [labelArray];
      }
      labelArray.forEach(function(id) {
        html = html + '<div' + (className ? ' class="'+className+'"':'') +' id="'+id+'">'+(noTitle ? '' : id)+'</div>';
      });
      return html;
    }

    function renderWeek(startDate,hoursOffset) {
      if (hoursOffset) { 
        startDate.setHours(hoursOffset); 
      } else {
        hoursOffset = 0;
      }

      var startMonthDay = startDate.getDate();
      var startDay = startDate.getDay();
      var body = $("#cal-body");
      var nav = $("#cal-nav");
      var tasks = filterToWeek(startDate);
      //TODO: ugh, please refactor this!

      body.empty();
      nav.empty();

      var navLabels = "- + R previous next today".split(' ');
      nav.append(div("nav-title",true));
      nav.append('<div id="week-title">'+startDate.toLocaleDateString()+"</div>");
      nav.append(div("mini-year-nav",true));
      nav.append(div("mini-month-nav",true));

      var yearNav = $("#mini-year-nav");
      var monthNav = $("#mini-month-nav");

      for (var i = 0; i < 12; i++) {
        yearNav.append('<div class="mini-month"></div>');
      }

      for (var i = 0; i < 5; i++) {
        monthNav.append('<div class="mini-week"></div>');
      }

      nav.append(div(navLabels,false,"nav-button"));

      $(".nav-button").on("touch click",function() {
        var label = this.id;
        var action = {
          next: function() {
            var nextDate = new Date(startDate.getTime());
            nextDate.setDate(startDate.getDate()+7);
            renderWeek(nextDate,hoursOffset);
            setStyles();
            // r(nextDate);
          },
          previous: function() {
            var prevDate = new Date(startDate.getTime());
            prevDate.setDate(startDate.getDate()-7);
            renderWeek(prevDate,hoursOffset);
            setStyles();
            // r(prevDate);
          },
          today: function() {
            renderWeek(weekOf(currentDate),hoursOffset);
            setStyles();
          },
          '+': function() {
            hoursOffset += 1;
            //TODO: please fix +24 and -0 offsets.
            hoursOffset = Math.min(hoursOffset,23);
            renderWeek(startDate,hoursOffset);
            setStyles();
            // r(hoursOffset);
          },
          '-': function() {
            hoursOffset -= 1;
            hoursOffset = Math.max(hoursOffset,0);
            renderWeek(startDate,hoursOffset);
            setStyles();
            // r(hoursOffset);
          },
          R: function() {
            hoursOffset = 0;
            renderWeek(startDate,hoursOffset);
            setStyles();
          }
        };
        action[label]();
      });

      for (var i = 0; i < 7; i++ ) {
        body.append('<div class="week-column"><div class="day-heading">'+dayName((startDay+i)%7)+' ('+(startMonthDay+i)+')</div><div class="day-tasks"></div></div>');
      }
      for (var j = 0; j < 48; j++ ) {
          $(".day-tasks").append("<div class=day-row>"+(j%2 ? '&nbsp':j/2+hoursOffset)+"</div>");
      }

      // $(".day-row").each(function(index,el) {
      //   // p(index);
      // });
      var columns = $(".day-tasks");
      tasks.forEach(function(task) { renderTask(task) });

      function renderTask(task) {
        var day = task.startDate.getDate()-startMonthDay;
        var startTime = task.startDate.getHours()+task.startDate.getMinutes()/60-hoursOffset;

        //Date difference booleanized on purpose; dayBleedOffset is 0 or 24.
        //Only bleeds into next day; 24+ pom tasks not accounted for.
        var dayBleedOffset = (task.endDate.getDate()-task.startDate.getDate() > 0)*24;
        var endTime = task.endDate.getHours()+task.endDate.getMinutes()/60-hoursOffset + dayBleedOffset;
        if (startTime < 0) {
          day -= 1;
          startTime += 24;
          endTime += 24;
          dayBleedOffset = 24;
        }
        var top = (startTime/24*100).toFixed(2);
        //clamps to 0
        var bottom = Math.max((100-(endTime)/24*100),0).toFixed(2);

        $(columns[day]).append('<div class="task" style="top:'+top+'%;bottom:'+bottom+'%;background:'+parsleyColors[task.category]+'">'+task.category+'</div>');
        // p(day);
        if (endTime > 24 && day < 6) {
          top = 0.00;
          //if, in unlikely even of 48+ pomodoro task, clamps to 0.
          bottom = Math.max((100-(endTime-dayBleedOffset)/24*100),0).toFixed(2);
          // p("Second Bottom: " + bottom);
          $(columns[day+1]).append('<div class="task" style="top:'+top+'%;bottom:'+bottom+'%;background:'+parsleyColors[task.category]+'">'+task.category+'</div>');
        }
      }


      function filterToWeek(startDate,tasks) {
        var weekStart = startDate.getTime(),
            weekEnd = new Date(weekStart);
        weekEnd.setDate(startDate.getDate()+7);

        var tasks = tasks || parsley.tasks
        // p(tasks.length);

        var filtered = tasks.filter(function(task) {
          var taskStart = task.startDate.getTime();
          return taskStart >= weekStart && taskStart < weekEnd;
        });
        // p(filtered.length);
        return filtered;
      }

    }
  }

  //TODO: get rid of this horrifying, doubled up crap. See parsley.js for details.
  function createFilteredStats(filtered) {
    var stats = {};
    filters.forEach(function (key) { stats[key] = {} });

    filtered.forEach(function (task) { 
      filters.forEach(function (key) {
        var value = task[key];
        stats[key][value] = stats[key][value] || 0;
        stats[key][value] += parseInt(task.duration);
      });
    });
    return stats;
  }

  function clearSelectionObject (exclusions) {
    filters.forEach(function (title) {
      if (exclusions.indexOf(title) == -1) {
        delete(selectionObject[title]);
      }
    });
  }

  function linesFromFiltered(filtered) {
    r();
    filtered.forEach( function(task,index) { 
      p(parsley.lines[task.index]);
    });
  }

  function filterParsleyBySelectionObject() {
    var filtered = parsley.tasks.filter(function(task) {
      var conditionChecks = [];
      var selectAll;
      for (var key in selectionObject) {
        selectAll = false;
        selectionObject[key].forEach(function(item) {
          if (/^All \(\d+ items\)$/.test(item)) { selectAll = true; }
        });
        conditionChecks.push(selectAll || selectionObject[key].indexOf(task[key]) != -1)
      }
      // p(conditionChecks.indexOf(false) == -1);
      return conditionChecks.indexOf(false) == -1;
    });  
    return filtered;
  }
  function filterParsleyBy(key,matches) {
    // p(key);
    // p(matches);
    var selectAll = false;
    matches.forEach(function(item) {
      if (/^All \(\d+ items\)$/.test(item)) { selectAll = true; }
    });

    var filtered = parsley.tasks.filter(function(task) { 
      return selectAll || matches.indexOf(task[key]) != -1;
    });
    // p(filtered);
    return filtered;
  }

  function loadPomsheet(data) {
    $("#pomsheet").text(data);
  }
  function buildData(data) {
    var lines = data.split(/\n/);
    return buildParsleyData(lines);
  }

  function getUnique(key,tasks) {
    // p(key);
    // p(tasks);
    tasks = tasks || parsley.tasks;
    var baseArray = tasks.map(function(task) { return task[key]; });
    return baseArray.filter(function(v,i) { return baseArray.indexOf(v) == i})
  }
  function clearFilters(exclusions) {
    filters.forEach(function (title) { 
      if (exclusions.indexOf(title) == -1) {
        $('#'+title+"-filter option").remove()
      }
    });
    // $(".filter option").remove();
  }
  function renderFilters(filtered) {
    var container = $("#filter-container");
    var width = 100.0/filters.length;

    filters.forEach(function (title) {
      container
        .append('<div class="filter-box"><div class="filter-caption">&nbsp&nbsp'+title+'</div><select id="'+title+'-filter" class="filter" name="'+title+'"" size="2" multiple></select></div>');
      populateFilter(title);
    });

    // filters.forEach(function (title) {
    //   $(".filter").append('<option value="'+title+'">'+title+'</option>')
    // });
    $(".filter")
      .css({
        width: "100%",
        borderStyle: "none",
        color: "white",
        background: "rgb(100,100,100)",
        height: "100%"
      });
    $(".filter-box")
      .css({
        display: "flex",
        flexFlow: "column",
        boxSizing: "border-box",
        height: "100%",
        background: "rgb(100,50,50)",
        width: width+"%",
        float: "left"
      });
  }
  function populateFilters(filtered,exclusions,stats) {
    filters.forEach(function (title) {
      // p(exclusions);
      // p(title +":"+ exclusions.indexOf(title));
      if (exclusions.indexOf(title) == -1) {
        populateFilter(title,filtered,stats);
      }
    });
  }
  function populateFilter(title,filtered,stats) {
    var stats = stats || parsley.stats;
    var uniques = getUnique(title,filtered).sort();
    var currentFilter = $('#'+title+'-filter');
    currentFilter.append('<option>All ('+uniques.length+' items)</option>');

    uniques.forEach(function(option) { 
      //the following requires stats removal for on-click look up
      currentFilter.append('<option>'+option+' ('+stats[title][option]+')</option>');
    });
  }
});  

//BEGIN Print Helpers
function r(whatever,noBreak) {
  $("#output").text("");
  return p(whatever,noBreak);
}

function printString(whatever,noBreak) { 
    $("#output").append(whatever);
    if (!noBreak) { $("#output").append("<br>") }
}
function printObject(object,noBreak) {
  var pom_props = Object.keys(object);
  printString("{ ", true);
  for (var i = 0; i < pom_props.length; i++) {
    printString(pom_props[i] + ": ", true);
    p(object[pom_props[i]],true);
    if (i < (pom_props.length-1)) { printString(", ",true); }
  }
  printString(" }", true);
  if (!noBreak) { $("#output").append("<br>") }
}
function printArray(array,noBreak) {
  printString("[",true);
  for (var i = 0; i < array.length; i++) { 
    p(array[i],true);
    if (i < (array.length-1)) printString(", ", true); 
  }
  printString("]",true);
  if (!noBreak) { $("#output").append("<br>") }
}

function p(variable,noBreak) { 
  if (variable instanceof Object) {
    if (variable instanceof Array) {
      printArray(variable,noBreak);
    } else if (variable instanceof Date) {
      printString("(Date Object) " + variable,noBreak);
    } else {
      printObject(variable,noBreak);
    }
  }
  else {
    printString(variable,noBreak); 
  }
  return variable;
}

//END Print Helpers