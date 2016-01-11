/*
1. Move all time-related utility function OUT of renderCalendar().
    arcOf(), weekOf(), dayNameShort(), monthNameShort(), etc. etc.
2. Move filterToWeek and createFilteredStats() into parsley, where they 
    belong
3. Turn renderCalendar() into the "init" portion of the calendarView
4. Make renderTimebar(), renderWeek(), renderFilters() public, so that
    calendarController() can call them.
*/


var calendarView = function() {  
  return {
    init: function(model) { 
      return renderCalendar(model.parsley,model.journal);
    }
  }
  //TODO: clean this WAY up
  //For now, it returns renderWeek() and renderTimebar()
  //for the view interface to be used by calendarController()
  function renderCalendar(parsley,journal,startDate) {
    //TODO: make sure renderWeek uses hoursOffset to determine what "today" is!!
    //TODO: generateParlsyeColors is STILL iffy... figure out where to put it
    var $weekMode = "Box"
    function generateParsleyColors(parsley,property) { 
      var colors = {}
      var stats = Object.keys(parsley.stats[property]);
      var seed;

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

    var parsleyColors = {};
    parsleyColors["category"] = generateParsleyColors(parsley,"category");
    parsleyColors["subcategory"] = generateParsleyColors(parsley,"subcategory");

    var currentDate = new Date();
    //Quicky currentDate() debug:
    // currentDate.setMonth(11);
    // currentDate.setDate(29);
    // currentDate.setYear(2015);

    // var $calendar = $("#pomsheet");
    $("#calendar").append(div("cal-heading",true));
    var labels = "weeklies timebar treemap".split(' ');
    // $calendar.append(div("cal-heading",true));
    $("#cal-heading").append(div(labels,false,"label"));
    $("#cal-heading").append(div("task-details",true));
    $("#calendar").append(div("cal-nav",true))
    $("#calendar").append(div("cal-body",true));

    // div("previous");
    var hoursOffset = 12;
    offsetCurrentDate = new Date(currentDate.getTime());
    offsetCurrentDate.setHours(offsetCurrentDate.getHours()-hoursOffset);

    var startDate = startDate || weekOf(offsetCurrentDate);

    var benchStart, benchEnd, benchElapsed;
    //EXTRACT INTO OPTIONS:

    benchStart = new Date().getTime();
    renderWeek(startDate,hoursOffset);
    // renderTimebar(arcOf(startDate));

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
          renderTimebar(arcOf(startDate));
        },
        treemap: function() {
          renderTreemap();
        }

      }
      action[label]();
    });

    return {
      renderWeek: renderWeek,
      renderTimebar: renderTimebar,
      setMonth: function(index) {
        var newDate = new Date(startDate.getTime()); 
        newDate.setMonth(index);
        renderWeek(newDate,hoursOffset,$weekMode);
      },
      setWeek: function(index) {
        var newDate = new Date(startDate.getTime()),
            newWeekStart = (index)*7+1;
        newDate.setDate(newWeekStart);
        renderWeek(newDate,hoursOffset,$weekMode);

      },
      setYear: function(index) {
        var newDate = new Date(startDate.getTime());
        var year = parsley.getUnique("year").sort();
        newDate.setYear(year[index]);
        renderWeek(newDate,hoursOffset,$weekMode);
      },
      setOption: function(index) { 
        //Ugh...
        $weekMode = ["Box","Report"][index];
        renderWeek(startDate,hoursOffset,$weekMode);
      }
    }

    function arcOf(date) {
      var copiedDate = new Date(date.getTime());
      var month = copiedDate.getMonth();
      copiedDate.setDate(1);
      copiedDate.setMonth(Math.floor(month/3)*3);
      copiedDate.setHours(0,0,0,0);
      return copiedDate;
    }

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
    function dayNameShort(num) {
      return "Sun Mon Tue Wed Thu Fri Sat".split(' ')[num];
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

    function renderTimebar(startDate,fullYear=false,propToShow="category") {
      // p(startDate);
      benchStart = new Date().getTime();
      $("#cal-body").empty();
      // $("#cal-nav").empty();
      $("#cal-nav *").unbind();
      var epicNav = $("#mini-epic-nav"),
          yearNav = $("#mini-year-nav"),
          monthNav = $("#mini-month-nav");
      yearNav.empty();
      monthNav.empty();
      epicNav.empty();
      $("#mini-option-nav").remove();

      var arcs = "Jan-Apr May-Aug Sep-Dec Full&nbspYear".split(' ');
      var monthsInArc = 4;
      var monthsToShow = fullYear ? 12 : monthsInArc;

      //Generate colors for property if they don't exist
      //Otherwise, use cached
      parsleyColors[propToShow] = parsleyColors[propToShow] || generateParsleyColors(parsley,propToShow);

      parsley.getUnique("year").sort().forEach(function(year) { 
        epicNav.append('<div class="mini-year">'+year+'</div>')
      });
      for (var i in arcs) {
        yearNav.append("<div class='mini-month'>"+arcs[i]+"</div>");
      }
      var items = "Categories Subcategories Media Supps".split(' ');
      for (var i in items) { 
        monthNav.append("<div class ='mini-week'>"+items[i]+"</div>");
      }

      // var weekIndex = Math.floor((startDate.getDate()-1)/7)+1;
      // // p(weekIndex);
      // var monthIndex = startDate.getMonth()+1;

      //Please stop calling parsley.getUnique().sort() for this crap.
      var yearIndex = parsley.getUnique("year").sort().indexOf(startDate.getFullYear().toString())+1;

      var arcIndex = Math.floor(startDate.getMonth()/3)+1;
      var arcPos = (arcIndex-1)*monthsInArc;
      var propOptions = "category subcategory media".split(' ');

      // $("#mini-month-nav .mini-week:nth-child("+weekIndex+")").addClass("current");
      $("#mini-epic-nav .mini-year:nth-child("+yearIndex+")").addClass("current");
      $("#mini-year-nav .mini-month:nth-child("+(fullYear ? 4 : arcIndex)+")").addClass("current");
      $("#mini-month-nav .mini-week:nth-child("+(propOptions.indexOf(propToShow)+1)+")").addClass("current");

      $(".mini-month").on("touch click", function() {
        var index = $(".mini-month").index(this);
        var newDate = new Date(startDate.getTime());
        //calls renderTimebar for full year display
        if (index == 3) {
          newDate.setMonth(0);
          renderTimebar(newDate,true,propToShow);
        } else {
          newDate.setMonth(index*4);
          renderTimebar(newDate,false,propToShow);
        }      
      });
      $(".mini-year").on("touch click", function() { 
        var index = $(".mini-year").index(this);
        var newDate = new Date(startDate.getTime());
        var year = parsley.getUnique("year").sort();
        // p(year);
        // p(index);
        newDate.setYear(year[index]);
        renderTimebar(newDate,fullYear,propToShow);
      });
      //bleh, refactor this; not week in this view
      $(".mini-week").on("touch click", function() {
        var index = $(".mini-week").index(this);
        if (index == 3) {
          //do supp thing
        } else {
          renderTimebar(startDate,fullYear,propOptions[index]);
        }
      });

      var table = $("<table>").addClass('timebar');
      var row,catCol;
      var headingRow = "<td style='white-space:nowrap;width:1px;'>Categories</td>"
      for (i = 0; i < monthsToShow; i++) {
        headingRow += "<td colspan=5>"+monthNameShort(i+arcPos)+"</td>";
      }

      // p(monthsInArc*5);
      // p(arcPos*5);
      


      table.append(headingRow);
      var tasks = fullYear ? filterToYear(startDate) : filterToArc(startDate),
          gridStats = buildGridStats(tasks),
          uniques = parsley.getUnique(propToShow,tasks);
          stats = parsley.createFilteredStats(tasks);
      // uniques = uniques.reverse();
      uniques = uniques.sort(function(a,b) {
        return Object.keys(gridStats[b]).length-Object.keys(gridStats[a]).length
        // return stats.category[b]-stats.category[a];
      });
      function d2h(d) {return d.toString(16);}

      var drawStart = fullYear ? 0 : arcPos*5,
          drawEnd = fullYear ? 60 : (arcPos+monthsInArc)*5;

      uniques.forEach(function(property,i) {
        // if (category != "Bindu") { return; }
        // if (!category) { p(i); }
        var dayCols ='';
        var propColor = parsleyColors[propToShow][property];
        var displayNum;
        for (var i = drawStart; i < drawEnd; i++) {
          displayNum = parseInt((gridStats[property][i+1]/1).toFixed(0));
          // displayNum = '';
          dayCols += gridStats[property][i+1] ? "<td style='background:"+propColor+"'>"+displayNum+"</td>" : "<td>&nbsp&nbsp</td>";
          // dayCols += gridStats[property][i+1] ? "<td style='background:"+propColor+"'>" : "<td>";
          // dayCols += "&nbsp</td>";
        }
        row = $("<tr>");
        var propString = property.replace(' ','&nbsp')+"&nbsp("+stats[propToShow][property]+"&nbspof&nbsp"+parsley.stats[propToShow][property]+")";
        
        propCol = $("<td style='background:"+propColor+"'>"+propString+"</td>");
        row = row.append(propCol).append(dayCols);

        // $("#cal-body").append("<div class=timebar-cat>"+property+"</div>");
        table.append(row);
      });
      $("#cal-body").append(table);
      benchEnd = new Date().getTime();
      benchElapsed = benchEnd-benchStart;
      // r("Timebar time: " + benchElapsed);

      function buildGridStats(tasks) {
        var gridStats = {}
        tasks = tasks || parsley.tasks
        tasks.forEach(function(task) {
          // if (task.category != 'Bindu') { return; }
          var property = task[propToShow]
          gridStats[property] = gridStats[property] || {};
          var monthDay = task.baseDate.getDate();
          var month = task.baseDate.getMonth();
          var yearWeek = weekNum(monthDay)+5*month;
          // p(task.baseDate.toLocaleDateString());
          // p(yearWeek);
          gridStats[property][yearWeek] = gridStats[property][yearWeek] || 0;
          //TODO: investigate parsley's string property bullshit
          gridStats[property][yearWeek] += parseInt(task.duration);
          
          // p(task.baseDate.toLocaleDateString(),true);
          // p(" "+yearWeek);
        });
        // p(gridStats['Bindu']);
        return gridStats;
      }
      function weekNum(monthDay) {
        return Math.floor((monthDay-1)/7)+1;
      }
      /* Assumes that startDate has already had arcOf() called on it */
      /* Corresponds to filterToWeek() in renderWeek() */
      //TODO: explore making filterToWeek also use baseDate?
      function filterToArc(startDate,tasks) {
        var arcStart = startDate.getTime(),
            arcEnd = new Date(arcStart),
            startMonth = startDate.getMonth();
        arcEnd.setMonth(startMonth+4);
    
        var tasks = tasks || parsley.tasks

        var filtered = tasks.filter(function(task) {
          var taskStart = task.baseDate.getTime();
          return taskStart >= arcStart && taskStart < arcEnd.getTime();
        });
        return filtered;
      }
      function filterToYear(startDate,tasks) {
        var targetYear = startDate.getFullYear();
        var tasks = tasks || parsley.tasks
        var filtered = tasks.filter(function(task) {
          var taskYear = task.baseDate.getFullYear();
          return targetYear == taskYear;
        })
        return filtered;
      }
    }

    function renderTreemap() {
      p("OH BOY!");
    }

    function renderWeek(startDate,hoursOffset,mode="Box") {
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
          stats = parsley.createFilteredStats(tasks);
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
      nav.append(div("mini-option-nav",true));

      var epicNav = $("#mini-epic-nav"),
          yearNav = $("#mini-year-nav"),
          monthNav = $("#mini-month-nav");
          optionNav = $("#mini-option-nav");

      parsley.getUnique("year").sort().forEach(function(year) { 
        epicNav.append('<div class="mini-year">'+year+'</div>')
      });

      for (var i = 0; i < 12; i++) {
        yearNav.append('<div class="mini-month">'+monthNameShort(i)+'</div>');
      }
      for (var i = 0; i < 5; i++) {
        monthNav.append('<div class="mini-week">'+(i+1)+'</div>');
      }
      var navOptions = "Box Report".split(' ');
      for (var i in navOptions) { 
        optionNav.append('<div class="mini-option">'+navOptions[i]+'</div>');
      }


      var weekIndex = Math.floor((startDate.getDate()-1)/7)+1;
      // p(weekIndex);
      var monthIndex = startDate.getMonth()+1;

      //Please stop calling parsley.getUnique().sort() for this crap.
      var yearIndex = parsley.getUnique("year").sort().indexOf(startDate.getFullYear().toString())+1;

      $("#mini-year-nav .mini-month:nth-child("+monthIndex+")").addClass("current");
      $("#mini-month-nav .mini-week:nth-child("+weekIndex+")").addClass("current");
      $("#mini-epic-nav .mini-year:nth-child("+yearIndex+")").addClass("current");
      $("#mini-option-nav .mini-option:nth-child("+(navOptions.indexOf(mode)+1)+")").addClass("current");

      nav.append(div(navLabels,false,"nav-button"));

      // $(".mini-month").on("touch click", function() {
      //   var index = $(".mini-month").index(this);
      //   var newDate = new Date(startDate.getTime()); 
      //   newDate.setMonth(index);
      //   renderWeek(newDate,hoursOffset,mode);

      // });
      // $(".mini-week").on("touch click", function() { 
      //   var index = $(".mini-week").index(this);
      //   var newDate = new Date(startDate.getTime());
      //   var newWeekStart = (index)*7+1;
      //   newDate.setDate(newWeekStart);
      //   renderWeek(newDate,hoursOffset,mode);

      // });

      // $(".mini-year").on("touch click", function() { 
      //   var index = $(".mini-year").index(this);
      //   var newDate = new Date(startDate.getTime());
      //   var year = parsley.getUnique("year").sort();
      //   // p(year);
      //   // p(index);
      //   newDate.setYear(year[index]);
      //   renderWeek(newDate,hoursOffset,mode);
      // });

      // $(".mini-option").on("touch click", function() { 
      //     var mode = $(this).text();
      //     renderWeek(startDate,hoursOffset,mode);
      // });


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

            renderWeek(nextDate,hoursOffset,mode);
      
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
                prevDate.setDate(22);
              }
            }
            renderWeek(prevDate,hoursOffset,mode);
      
            // r(prevDate);
          },
          today: function() {
            renderWeek(weekOf(currentDate),hoursOffset,mode);
      
          },
          '+': function() {
            hoursOffset += 1;
            //TODO: please fix +24 and -0 offsets.
            hoursOffset = Math.min(hoursOffset,23);
            renderWeek(startDate,hoursOffset,mode);
      
            // r(hoursOffset);
          },
          '-': function() {
            hoursOffset -= 1;
            hoursOffset = Math.max(hoursOffset,0);
            renderWeek(startDate,hoursOffset,mode);
      
            // r(hoursOffset);
          },
          R: function() {
            hoursOffset = 0;
            renderWeek(startDate,hoursOffset,mode);
      
          }
        };
        action[label]();
        benchEnd = new Date().getTime();
        benchElapsed = benchEnd-benchStart;
        // r(benchElapsed);
      });

      var columnLabel, dayPos;
      if (mode == "Box") {
        for (var i = 0; i < 7; i++ ) {
          //this kills extra columns on week 5
          // if (startMonthDay+i > daysInMonth) { break; }
          columnLabel = dayName((startDay+i)%7)+'&nbsp'+(startDate.getMonth()+1)+'/'+(startMonthDay+i); 
          body.append('<div class="week-column"><div class="day-heading">'+columnLabel+'</div><div class="day-tasks"></div></div>');
        }
      } else {
        for (var i = 0; i < 4; i++) {
          dayPos = i*2;
          columnLabel = (dayPos < 6) ?
            dayNameShort((startDay+dayPos)%7)+'-'+dayNameShort((startDay+dayPos+1)%7)+',&nbsp'+monthNameShort(startDate.getMonth())+'&nbsp'+(startMonthDay+dayPos)+'-'+(startMonthDay+dayPos+1) :
            dayNameShort((startDay+dayPos)%7)+',&nbsp'+monthNameShort(startDate.getMonth())+'&nbsp'+(startMonthDay+dayPos);

          body.append('<div class="block-column"><div class="day-heading">'+columnLabel+'</div><div class="block-report"></div></div>');
        }
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
        totalsBody.append("<div style='background:"+parsleyColors["category"][name]+";height:"+heightMap[i]+"px' class='total-item'>"+(heightMap[i] >= totalsMinLabelHeight ? name+" "+poms : '')+"</div>");
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

      //TODO: use a report with this structure somewhere (function not called)
      printReport();
      function printReport() {
        var reports = [];
        tasks.forEach(function(task) {
          var baseDay = task.baseDate.getDate();
         //TODO: make this a general utility function
          var blockIndex = Math.floor(((baseDay-1)%7+2)/2)-1; 
          reports[blockIndex] = reports[blockIndex] || {};
          var report = reports[blockIndex];

          report[task.category] = report[task.category] || {}
          report[task.category][task.subcategory] = report[task.category][task.subcategory] || [];
          var capitalized = task.description.charAt(0).toUpperCase() + task.description.slice(1);
          report[task.category][task.subcategory].push(capitalized);
          //ToDo: maybe underline?
          // if (task.tag.indexOf("!") != -1) { report[task.category][task.subcategory].push("--!--"); }
        });     
        reports.forEach(function (report,index) {
          var column = $(".block-report:eq("+(index)+")");
          Object.keys(report).sort().forEach(function (key) {
            var color = parsleyColors["category"][key];
            // column.append("<span style='color:"+color+"'>"+key+"\n");
            Object.keys(report[key]).sort().forEach(function (subkey) {
              var subcolor = parsleyColors["subcategory"][subkey];
              column.append("<span style='color:"+color+"'>"+key+"</span> :: "+"<span style='color:"+subcolor+"'>"+subkey+"\n");
              for (i in report[key][subkey]) {
                column.append("      "+report[key][subkey][i]+"\n");
              }
            });
          });
        });
      }

      //TODO: rewrite this! This is AWFUL!
      tasks.forEach(function(task) { 
        var day = task.startDate.getDate()-startMonthDay;
        //quicky way to catch month-ends
        //necessary to fix after-midnight month-end blocks
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
        //bottom clamps to 0
        var top = (startTime/24*100).toFixed(2),
            bottom = Math.max((100-(endTime)/24*100),0).toFixed(2);
        
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
          $(columns[day]).append('<div data-i="'+task.index+'" class="task" style="top:'+top+'%;bottom:'+bottom+'%;background:'+parsleyColors["category"][task.category]+'">'+task.category+' '+weekSums[task.category]+'</div>');

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
        var dayStart = journal.dayStartHour(currentDay);
        if (typeof dayStart == 'number') { 
          for (var i = 0; i < 4; i++) {
            addDayBar(".day-tasks",index,dayStart-hoursOffset+i*5);
          }
        } 


      });

      //TODO: refactor this with addTotalsBar()?
      function addDayBar(el,index,hours,label) {
        var height = (hours/24*99.84).toFixed(2)/1;
        label = label || '';
        var wrongDayStyle = (height > 100 || height < 0) ? ";background:red" : '';
        if (height > 100) { 
          height -= 100; index += 1;
        } else if (height < 0) {
          height += 100; index -= 1;
        } 
        if (index >= 0 && index <= 6) {
          $(el+":eq("+index+")").append("<div class=day-bar style='top:"+height+"%"+wrongDayStyle+"'>"+label+"</div>");
        }
      }

      /* Assumes that startDate has already had weekOf() called on it */
      function filterToWeek(startDate,tasks) {
        var weekStart = startDate.getTime(),
            weekEnd = new Date(weekStart);
        //WARNING: using daysInMonth from WAY up top out of sheer laziness
        //NOTE: this eliminates Week 5 overdraw, but preserves day-bleed
        //Proprietary to renderWeek(), so shouldn't be in here.
        var endDate = Math.min(startDate.getDate()+7,daysInMonth+1);
        weekEnd.setDate(endDate);

        var tasks = tasks || parsley.tasks
        // p(tasks.length);

        var filtered = tasks.filter(function(task) {
          var taskStart = task.startDate.getTime();
          return taskStart >= weekStart && taskStart < weekEnd.getTime();
        });
        // p(filtered.length);
        // p(filtered);
        return filtered;
      }

    }
  }




}();