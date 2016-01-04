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
var thisYear = $.get('/2013');
var journalRaw = $.get('/journal');

$.when(lastYear,thisYear,journalRaw).done(function (lastYear,thisYear,journalRaw) {
  var data = lastYear[0] + "\n" + thisYear[0];
// $.get("/2015",function (data) {

  var parsley = buildData(data);
  // p(parsley.media);
  // p(parsley.tasks);

  //This is... iffy. Not sure where to put it yet:
  var parsleyColors = generateParsleyColors(parsley,"category");
  // var subcatColors = generateParsleyColors(parsley,"subcategory");

  var filters = "year month week tag category subcategory".split(' ');
  // p(parsley);
  var selectionObject = {}

  //TODO: make sure renderWeek uses hoursOffset to determine what "today" is!!
  var currentDate = new Date();
  // DELETE
  // currentDate.setMonth(11);
  // currentDate.setDate(8);
  // currentDate.setYear(2015);

  

  var journalLines = journalRaw[0].split("\n");
  var journal = buildJournal(journalLines);


  
  // p(journal.entries);

  //DELETE!
  // currentDate.setDate(currentDate.getDate()-1);


  renderCalendar();

  loadPomsheet(data);
  renderFilters();


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
    var labels = "weeklies timebar treemap".split(' ');
    // $calendar.append(div("cal-heading",true));
    $("#cal-heading").append(div(labels,false,"label"));
    $("#cal-heading").append(div("task-details",true));
    $("#calendar").append(div("cal-nav",true))
    $("#calendar").append(div("cal-body",true));

    // div("previous");
    var startDate = startDate || weekOf(currentDate);

    var benchStart, benchEnd, benchElapsed;
    //EXTRACT INTO OPTIONS:
    var hoursOffset = 8

    benchStart = new Date().getTime();
    // renderWeek(startDate,hoursOffset);
    renderTimebar();
    benchEnd = new Date().getTime();
    benchElapsed = benchEnd-benchStart;
    // p(benchElapsed);

    $("#cal-heading .label").on("touch click",function() {
      var label = this.id;
      var action = {
        weeklies: function() {
          renderWeek(startDate,hoursOffset);
        },
        timebar: function() {
          renderTimebar();
        },
        treemap: function() {
          renderTreemap();
        }

      }
      action[label]();
    });

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

    function renderTimebar() {
      benchStart = new Date().getTime();
      $("#cal-body").empty();
      // $("#cal-nav").empty();

      var table = $("<table>").addClass('timebar');
      var row,catCol;
      var headingRow = "<td style='white-space:nowrap;width:1px;'>Categories</td>"
      for (i = 0; i < 12; i++) {
        headingRow += "<td colspan=5>"+monthNameShort(i)+"</td>";
      }

      table.append(headingRow);
      var gridStats = buildGridStats();
      var uniques = getUnique("category");
      uniques = uniques.sort(function(a,b) {
        return parsley.stats.category[b]-parsley.stats.category[a];
      });
      function d2h(d) {return d.toString(16);}
      uniques.forEach(function(category,i) {
        // if (category != "Bindu") { return; }
        // if (!category) { p(i); }
        var dayCols ='';
        var catColor = parsleyColors[category];
        var displayNum;
        for (var i = 0; i < 60; i++) {
          displayNum = d2h(parseInt((gridStats[category][i+1]/6).toFixed(0)));
          dayCols += gridStats[category][i+1] ? "<td style='background:"+catColor+"'>"+displayNum+"</td>" : "<td>&nbsp&nbsp</td>";
          // dayCols += gridStats[category][i+1] ? "<td style='background:"+catColor+"'>" : "<td>";
          // dayCols += "&nbsp</td>";
        }
        row = $("<tr>");
        var catString = category.replace(' ','&nbsp')+"&nbsp("+parsley.stats["category"][category]+")";
        
        catCol = $("<td style='background:"+catColor+"'>"+catString+"</td>");
        row = row.append(catCol).append(dayCols);

        // $("#cal-body").append("<div class=timebar-cat>"+category+"</div>");
        table.append(row);
      });
      $("#cal-body").append(table);
      benchEnd = new Date().getTime();
      benchElapsed = benchEnd-benchStart;
      // r("Timebar time: " + benchElapsed);

      function buildGridStats() {
        var gridStats = {}
        parsley.tasks.forEach(function(task) {
          // if (task.category != 'Bindu') { return; }
          var cat = task.category
          gridStats[cat] = gridStats[cat] || {};
          var monthDay = task.baseDate.getDate();
          var month = task.baseDate.getMonth();
          var yearWeek = weekNum(monthDay)+5*month;
          // p(task.baseDate.toLocaleDateString());
          // p(yearWeek);
          gridStats[cat][yearWeek] = gridStats[cat][yearWeek] || 0;
          //TODO: investigate parsley's string property bullshit
          gridStats[cat][yearWeek] += parseInt(task.duration);
          
          // p(task.baseDate.toLocaleDateString(),true);
          // p(" "+yearWeek);
        });
        // p(gridStats['Bindu']);
        return gridStats;
      }
      function weekNum(monthDay) {
        return Math.floor((monthDay-1)/7)+1;
      }
    }

    function renderTreemap() {
      p("OH BOY!");
    }

    function renderWeek(startDate,hoursOffset) {
      if (hoursOffset) { 
        startDate.setHours(hoursOffset); 
      } else {
        hoursOffset = 0;
      }

      var startMonthDay = startDate.getDate(),
          startDay = startDate.getDay(),
          daysInMonth = new Date(startDate.getFullYear(),startDate.getMonth()+1,0).getDate(),
          body = $("#cal-body"),
          nav = $("#cal-nav"),
          tasks = filterToWeek(startDate),
          stats = createFilteredStats(tasks);
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

      $(".mini-month, .mini-week, .mini-year, .nav-button")
        .on("mouseover", function() {
          $(this).addClass('hovered')
        }).on("mouseout",function() {
          $(this).removeClass('hovered')
        });


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
        // r(benchElapsed);
      });

      for (var i = 0; i < 7; i++ ) {
        body.append('<div class="week-column"><div class="day-heading">'+dayName((startDay+i)%7)+'&nbsp'+(startDate.getMonth()+1)+'/'+(startMonthDay+i)+'</div><div class="day-tasks"></div></div>');
      }

      var weekCats = Object.keys(stats.category);
      weekCats.sort(function (a,b) {
        return stats.category[b] - stats.category[a];
      });

      var weekTotal = weekCats.reduce(function(sum,item) { 
        return sum + stats.category[item]; 
      },0);

      body.append('<div id=week-totals></div>');
      $("#week-totals").append("<div class=day-heading>Totals</div><div id=totals-body></div><div class=day-footer>"+weekTotal+"</div>");
      
      var totalsBody = $("#totals-body");
      var hoursInPomDay = 15;
      var parentHeight = parseInt(totalsBody.css("height"));
      var hourPixels = parentHeight/(hoursInPomDay*7);

      //normally 12
      var totalsMinHeight = 0;
      //normally superfluous
      var totalsMinLabelHeight = 10;
      var minHeightAdjustment = 0;
      var heightMap = [];
      // 1. Take care of basic case (ie. assume there are available divs)
      // 2. Deal with case where there there is no space to redistribute

      weekCats.forEach(function(name) {
        var poms = stats.category[name];
        var divHeight = Math.round(poms/2*hourPixels);
        minHeightAdjustment += Math.max(totalsMinHeight-divHeight,0);
        // heightMap.push(divHeight);
        divHeight = Math.max(divHeight,totalsMinHeight);
        heightMap.push(divHeight);
      })
      var candidateDivs = true;
      // for (var z = 0; z < 3; z++) {
      while (minHeightAdjustment && candidateDivs) {
        candidateDivs = false;
        heightMap.forEach(function(height,index) {
          if (height <= totalsMinHeight+1 || !minHeightAdjustment) { return }
          candidateDivs = true;
          heightMap[index] -= 1;
          minHeightAdjustment -= 1;
        });
      }

      // var heightMapSum = heightMap.reduce(function(sum,item) { return sum += item });

  
      // p(heightMap);
      // p("heightMapSum: " + heightMapSum);
      // p("candidateDivs: " + candidateDivs);


      weekCats.forEach(function(name,i) {
        var poms = stats.category[name];
        totalsBody.append("<div style='background:"+parsleyColors[name]+";height:"+heightMap[i]+"px' class='total-item'>"+(heightMap[i] >= totalsMinLabelHeight ? name+" "+poms : '')+"</div>");
      });
      // p("week total: " + Math.round(weekTotal/2*hourPixels));
      // p("adjustment total: " + minHeightAdjustment);
      // var singleAdjust = Math.floor(minHeightAdjustment/adjustedDivs);
      // var adjustRemainder = minHeightAdjustment%adjustedDivs;
      // p("adjusted divs: "+adjustedDivs);
      // p("total divs: " + weekCats.length);
      // p("single: "+singleAdjust);
      // p("remainder: "+adjustRemainder);
      // p('');

      $(".total-item").each(function() {
        var prevHeight = parseInt($(this).css("height"));
        
      })
      // addTotalsBar(16*7,"16 hpd");
      // addTotalsBar(15*7,"15 hpd");
      // addTotalsBar(24*7,"24 hpd");
      // addTotalsBar(9*7,"18 ppd");
      // p(weekTotal);
      addTotalsBar(weekTotal/2);

      function addTotalsBar(hours,label) {
        var height = Math.round(hours*hourPixels);
        label = label || '';
        totalsBody.append("<div class=totals-bar style='top:"+height+"px'>"+label+"</div>");
      }



      var columns = $(".day-tasks");
      for (var j = 0; j < 48; j++ ) {
          columns.append("<div class=day-row>"+(j%2 ? '&nbsp':j/2+hoursOffset)+"</div>");
      }

      //TODO: put weekSums in parsley
      var weekSums = {};
      // var weekSumsSubcat = {};

      tasks.sort(function (a,b) { 
        return a.startDate.getTime() - b.startDate.getTime();
      });
      tasks.forEach(function(task) { 
        var day = task.startDate.getDate()-startMonthDay;
        //quicky way to catch month-ends
        if (day < 0) { day += daysInMonth; }

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

        drawTaskBox(day);
  
        if (endTime > 24 && day < 6) {
          top = 0.00;
          //if, in unlikely even of 48+ pomodoro task, clamps to 0.
          bottom = Math.max((100-(endTime-dayBleedOffset)/24*100),0).toFixed(2);
          drawTaskBox(day+1);
        }

        function drawTaskBox(day) {
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
        $(this).append("<div class='dosage'></div>");
        dosageBox = $('.dosage:last');
        dosageItems = journal.dayDosageItems(currentDay);
        dosageItems.forEach(function(item) { 
          dosageBox.append(item + '<br>');
        });



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
    return baseArray.filter(function(v,i) { return baseArray.indexOf(v) == i && v})
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