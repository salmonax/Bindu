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
var journalRaw = $.get('/journal');

$.when(lastYear,thisYear,journalRaw).done(function (lastYear,thisYear,journalRaw) {
  var data = lastYear[0] + "\n" + thisYear[0];
// $.get("/2015",function (data) {

  var parsley = buildData(data);
  //This is... iffy. Not sure where to put it yet:
  var parsleyColors = generateParsleyColors(parsley,"category");
  // var subcatColors = generateParsleyColors(parsley,"subcategory");

  var filters = "year month week tag category subcategory".split(' ');
  // p(parsley);
  var selectionObject = {}

  var currentDate = new Date();
  //DELETE
  currentDate.setMonth(11);
  currentDate.setDate(20);

  // var journalLines = journalRaw[0].split('\n');
  // var journal = buildJournal(journalLines);

  function buildJournal(lines) { 
    var journal = { entries: [] };
    lines.forEach(function(line) {
      if (isDateLine(line)) {
        journal.entries.push({ date: line })
      }
    })
    return journal;
    function isDateLine(line) {
      return /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s?(January|February|March|April|May|June|July|August|September|October|November|December)\s?\d{1,2}/.test(line);
    }
  }
  
  // p(journal.entries);

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
    $("#cal-heading").append(div("task-details",true));
    $("#calendar").append(div("cal-nav",true))
    $("#calendar").append(div("cal-body",true));

    // div("previous");
    var startDate = startDate || weekOf(currentDate);

    var benchStart, benchEnd, benchElapsed;

    benchStart = new Date().getTime();
    renderWeek(startDate,8);
    benchEnd = new Date().getTime();
    benchElapsed = benchEnd-benchStart;
    p(benchElapsed);

    function weekOf(date) {
      var day = date.getDate();
      var startDay = 7*Math.floor((day-1)/7)+1;
      var copiedDate = new Date(date.getTime());
      copiedDate.setDate(startDay);
      copiedDate.setHours(0,0,0,0);
      return copiedDate;
    }

    function dayName(num) {
      return "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(' ')[num];
    }
    function monthNameShort(num) {
      return "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(' ')[num]
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
      var stats = createFilteredStats(tasks);
      // p(stats);
      //TODO: ugh, please refactor this!

      body.empty();
      nav.empty();

      var navLabels = "- + R previous next today".split(' ');
      nav.append(div("nav-title",true));
      // nav.append('<div id="week-title">'+startDate.toLocaleDateString()+"</div>");
      nav.append(div("mini-epic-nav",true));
      nav.append(div("mini-year-nav",true));
      nav.append(div("mini-month-nav",true));

      var epicNav = $("#mini-epic-nav");
      var yearNav = $("#mini-year-nav");
      var monthNav = $("#mini-month-nav");


      getUnique("year").sort().forEach(function(year) { 
        epicNav.append('<div class="mini-year">'+year+'</div>')
      });

      for (var i = 0; i < 12; i++) {
        yearNav.append('<div class="mini-month">'+monthNameShort(i)+'</div>');
      }
      for (var i = 0; i < 5; i++) {
        monthNav.append('<div class="mini-week">'+(i+1)+'</div>');
      }
      var weekIndex = Math.floor((startDate.getDate()-1)/7)+1;
      // p(weekIndex);
      var monthIndex = startDate.getMonth()+1;

      //Please stop calling getUnique().sort() for this crap.
      var yearIndex = getUnique("year").sort().indexOf(startDate.getFullYear().toString())+1;

      $("#mini-year-nav .mini-month:nth-child("+monthIndex+")").addClass("current");
      $("#mini-month-nav .mini-week:nth-child("+weekIndex+")").addClass("current");
      $("#mini-epic-nav .mini-year:nth-child("+yearIndex+")").addClass("current");
  
      nav.append(div(navLabels,false,"nav-button"));

      $(".mini-month").on("touch click", function() {
        var index = $(".mini-month").index(this);
        var newDate = new Date(startDate.getTime()); 
        newDate.setMonth(index);
        renderWeek(newDate,hoursOffset);
  
      });
      $(".mini-week").on("touch click", function() { 
        var index = $(".mini-week").index(this);
        var newDate = new Date(startDate.getTime());
        var newWeekStart = (index)*7+1;
        newDate.setDate(newWeekStart);
        renderWeek(newDate,hoursOffset);
  
      });

      $(".mini-year").on("touch click", function() { 
        var index = $(".mini-year").index(this);
        var newDate = new Date(startDate.getTime());
        var year = getUnique("year").sort();
        // p(year);
        // p(index);
        newDate.setYear(year[index]);
        renderWeek(newDate,hoursOffset);
  
      });


      // UGH! PLEASE fix.
      // var originalBackground;
      // $(".mini-month, .mini-week")
      //   .on("mouseover", function() {
      //     originalBackground = $(this).css("background");
      //     $(this).css({ background: "orange"});
      //   }).on("mouseout", function() { 
      //     $(this).css({ background: originalBackground});
      //   });


      $(".nav-button").on("touch click",function() {
        benchStart = new Date().getTime();
        var label = this.id;
        var action = {
          next: function() {
            var nextDate = new Date(startDate.getTime());
            nextDate.setDate(startDate.getDate()+7);
            if (nextDate.getMonth() != startDate.getMonth()) {
              nextDate.setDate(1);
            }

            renderWeek(nextDate,hoursOffset);
      
            // r(nextDate);
          },
          previous: function() {
            var dateDiff = startDate.getDate()-7;
            var prevDate = new Date(startDate.getTime());
            prevDate.setDate(dateDiff);
            //sets date to 29th if there is month bleed
            //later, there will be a setting for this.
            if (dateDiff < 0) { 
              prevDate.setDate(29); 
              //fixes feb
              if (prevDate.getDate() == 1) {
                prevDate.setMonth(1);
                prevDate.setDate(21);
              }
            }
            renderWeek(prevDate,hoursOffset);
      
            // r(prevDate);
          },
          today: function() {
            renderWeek(weekOf(currentDate),hoursOffset);
      
          },
          '+': function() {
            hoursOffset += 1;
            //TODO: please fix +24 and -0 offsets.
            hoursOffset = Math.min(hoursOffset,23);
            renderWeek(startDate,hoursOffset);
      
            // r(hoursOffset);
          },
          '-': function() {
            hoursOffset -= 1;
            hoursOffset = Math.max(hoursOffset,0);
            renderWeek(startDate,hoursOffset);
      
            // r(hoursOffset);
          },
          R: function() {
            hoursOffset = 0;
            renderWeek(startDate,hoursOffset);
      
          }
        };
        action[label]();
        benchEnd = new Date().getTime();
        benchElapsed = benchEnd-benchStart;
        r(benchElapsed);
      });

      for (var i = 0; i < 7; i++ ) {
        body.append('<div class="week-column"><div class="day-heading">'+dayName((startDay+i)%7)+' '+(startDate.getMonth()+1)+'/'+(startMonthDay+i)+'</div><div class="day-tasks"></div></div>');
      }

      var weekCats = Object.keys(stats.category);
      weekCats.sort(function (a,b) {
        return stats.category[b] - stats.category[a];
      });

      var weekTotal = weekCats.reduce(function(sum,item) { 
        return sum + stats.category[item]; 
      },0);

      body.append('<div id=week-totals></div>');
      $("#week-totals").append("<div class=day-heading>Totals</div>");
      $("#week-totals").append("<div id=totals-body></div>")
      $("#week-totals").append("<div class=day-footer>"+weekTotal+"</div>");
      
      weekCats.forEach(function(name) {
        var poms = stats.category[name];
        // var divHeight = (stats.category[name]/weekTotal*100).toFixed(2) + "%";
        var divHeight = poms*3 + "px";
        $("#totals-body").append("<div style='background:"+parsleyColors[name]+";height:"+divHeight+"' class='total-item'>"+name+" "+poms+"</div>")
      });
  

      for (var j = 0; j < 48; j++ ) {
          $(".day-tasks").append("<div class=day-row>"+(j%2 ? '&nbsp':j/2+hoursOffset)+"</div>");
      }

      // $(".day-row").each(function(index,el) {
      //   // p(index);
      // });
      var columns = $(".day-tasks");
      //parsley will keep sums later; need this now.
      var weekSums = {};
      // var weekSumsSubcat = {};

      tasks.sort(function (a,b) { 
        return a.startDate.getTime() - b.startDate.getTime();

      });
      tasks.forEach(function(task) { 
        var day = task.startDate.getDate()-startMonthDay;
        var startTime = task.startDate.getHours()+task.startDate.getMinutes()/60-hoursOffset;

        //Date difference booleanized on purpose; dayBleedOffset is 0 or 24.
        //Only bleeds into next day; 24+ pom tasks not accounted for.
        var dayBleedOffset = (task.endDate.getDate()-task.startDate.getDate() != 0)*24;
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
        
        // if (task.category === "Watch" && weekSums[task.category] == 8) {
        //   p(task.description);
        //   p("top:"+top+", bottom: "+bottom);
        //   p(startTime);
        //   p(endTime);
        //   p(dayBleedOffset);
        // }

        weekSums[task.category] = weekSums[task.category] || 0;
        weekSums[task.category] += parseInt(task.duration);
        // weekSumsSubcat[task.subcategory] = weekSumsSubcat[task.subcategory] || 0;
        // weekSumsSubcat[task.subcategory] += parseInt(task.duration);

        drawBox(day);
  
        if (endTime > 24 && day < 6) {
          top = 0.00;
          //if, in unlikely even of 48+ pomodoro task, clamps to 0.
          bottom = Math.max((100-(endTime-dayBleedOffset)/24*100),0).toFixed(2);
          drawBox(day+1);
        }

        function drawBox(day) {
          $(columns[day]).append('<div data-i="'+task.index+'" class="task" style="top:'+top+'%;bottom:'+bottom+'%;background:'+parsleyColors[task.category]+'">'+task.category+' '+weekSums[task.category]+'</div>');

          // $(columns[day]).append('<div data-i="'+task.index+'" class="subtask" style="top:'+top+'%;bottom:'+bottom+'%;background:'+subcatColors[task.subcategory]+'">'+task.subcategory+' '+weekSumsSubcat[task.subcategory]+'</div>');
        }
      });

      var hoverTimeout = null;
      $(".task").on("mouseover", function() { 
        clearTimeout(hoverTimeout);
        var parsleyLine = parsley.lines[$(this).data('i')];
        $("#task-details").text(parsleyLine);
      });
      $(".task").on("mouseout", function() {
        hoverTimeout = setTimeout(function () {
          $("#task-details").text('')
        },1000);
      });


      //ToDo: get rid of this AWFUL way to get totals!
      $(".week-column").each(function (index,item) { 
        var currentDay = new Date(startDate.getTime());
        currentDay.setDate(currentDay.getDate()+index);
        var total = parsley.dayTotal(currentDay);
        var target = parsley.dayTarget(currentDay);

        // var ratio = total/target;
        // var green = "rgb(50,100,100)";
        //   purple = "rgb(50,150,75)";
        //   orange = "rgb(150,100,0)";
        //   red = "rgb(150,0,0)";

        // var colorString = ratio == 1 ? green : ratio > 1 ? purple : ratio > 0.60 ? orange : red;

        // $(this).append("<div style='text-align: center;background:"+colorString+"'>"+total+" / "+target+"</div>");
        $(this).append("<div class='day-footer' style='text-align: center'>"+total+"</div>");

      });


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