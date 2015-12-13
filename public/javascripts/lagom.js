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



// var lastYear = $.get('/2015');
// var thisYear = $.get('/2014');

// $.when(lastYear,thisYear).done(function (lastYear,thisYear) {
//   var data = lastYear[0] + "\n" + thisYear[0];

$.get("/2015",function (data) {

  var parsley = buildData(data);
  var filters = "year month week tag category subcategory".split(' ');
  // p(parsley);
  var selectionObject = {}

  var currentDate = new Date();

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

  function renderCalendar() {
    // var $calendar = $("#pomsheet");
    $("#calendar").append(div("cal-heading",true));
    var labels = "year week month day".split(' ');
    // $calendar.append(div("cal-heading",true));
    $("#cal-heading").append(div(labels,false,"label"));
    $("#calendar").append(div("cal-body",true));

    renderWeek(weekOf(currentDate));
    setStyles();
    function setStyles() {
      $("#cal-heading").css({
        boxSizing: "border-box",
        height: "30px",
        paddingTop: "5px",
        paddingLeft: "5px",
        background: "rgb(25,25,50)",
        overflow: "auto"
      });
      $("#calendar").css({
        // display: "flex",
        // flexFlow: "column"
        position: "absolute",
        top: "0px",
        bottom: "0px",
        left: "0px",
        right: "0px",
        background: "rgb(50,50,100)",
        overflow: "auto"
      });
      $(".label").css({
        float: "left",
        padding: "3px 10px",
        margin: "0 1px",
        background: "rgb(50,50,100)"
      });
      $("#cal-body").css({
        marginTop: "30px",
        boxSizing: "border-box",
        position: "absolute",
        background: "red",
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
        borderStyle: "dashed",
        borderWidth: "1px",
      });
      $(".day-heading").css({
        background: "blue",
        textAlign: "center"
      });
      $(".day-tasks").css({
        // opacity: 0.6,
        position: "relative",
        height: "100%",
        background: "orange",
        overflow: "hidden"
      });
      $(".task").css({
        position: "absolute",
        background: "green",
        width: "100%"
      });
    }

    function weekOf(date) {
      var day = date.getDate();
      var startDay = 7*Math.floor((day-1)/7)+1;
      var copiedDate = new Date(date.getTime());
      copiedDate.setDate(startDay);
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

    function renderWeek(startDate) {
      var startMonthDay = startDate.getDate();
      var startDay = startDate.getDay();
      var body = $("#cal-body");
      var tasks = filterToWeek(startDate);
      body.empty();

      for (var i = 0; i < 8; i++ ) {
        body.append('<div class="week-column"><div class="day-heading">'+dayName((startDay+i)%7)+' ('+(startMonthDay+i)+')</div><div class="day-tasks"></div></div>');
      }
      for (var j = 0; j < 24; j++ ) {
          $(".day-tasks").append("<div class=day-row>"+j+"</div>");
      }

      // $(".day-row").each(function(index,el) {
      //   // p(index);
      // });
      var columns = $(".day-tasks");
      tasks.forEach(function(task) {
        var day = task.startDate.getDate()-startMonthDay;
        var time = task.startDate.getHours() + task.startDate.getMinutes()/60;
        var top = (time/24*100).toFixed(2) +"%";
        $(columns[day]).append('<div class="task" style="top:'+top+'">'+time+" "+task.category+'</div>');
      });


      function filterToWeek(startDate,tasks) {
        var weekStart = startDate.getTime(),
            weekEnd = new Date(weekStart);
        weekEnd.setDate(startDate.getDate()+7);

        var tasks = tasks || parsley.tasks


        var filtered = tasks.filter(function(task) {
          var taskStart = task.startDate.getTime();
          return taskStart >= weekStart && taskStart < weekEnd;
        });
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