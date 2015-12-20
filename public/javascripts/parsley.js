  //!!!! NOTE: this resembles PomParsley the most.
// This is called in grepGraph.js, by updateWeekliesGraph()

  function buildParsleyData(lines) {  
    var line, week;
    var parsleyData = {};

    parsleyData = buildParsleyStructure();
    // p(parsleyData.targets);

    return parsleyData;

    function buildParsleyStructure() {
      // r("=== buildParsleyTotals() ===");
      var currentDate;
      var parsley = { 
        lines: lines, 
        tasks: [], 
        tags: {}, 
        stats: {},
        targets: {},

        dayTarget: function(dateWithOffset) {
          var index = monthName(dateWithOffset.getMonth());
          return parsley.targets[index];
        },

        dayTotal: function(dateWithOffset) {
          var startDate = dateWithOffset;
          var startTime = startDate.getTime();
          var endDate = new Date(startTime);
          endDate.setDate(endDate.getDate()+1);
          var endTime = endDate.getTime();
          //includes tasks with endDate within bounds
          var filtered = this.tasks.filter(function (task) {
            return (task.startDate.getTime() > startTime || task.endDate.getTime() > startTime) &&
                    task.startDate.getTime() < endTime;
          });
          return filtered.reduce(function (sum, task) {
            var bleedDuration = 0;
            //adjusts for tasks that are out of bounds
            if(task.startDate.getTime() < startTime) {
              bleedDuration = (startTime-task.startDate.getTime())/(3600000)*2;
            }
            if(task.endDate.getTime() > endTime) {
              bleedDuration = (task.endDate.getTime()-endTime)/(3600000)*2;
            }
            return sum + parseInt(task.duration)-bleedDuration;
          },0);
        }

      };

      var statsKeys = "year month week tag category subcategory".split(' ');
      statsKeys.forEach(function(key) { parsley.stats[key] = {} });
      //NOTE: currently assumes tag definitions are at the top of file!
      //would be better to capture all tag defs FIRST, then re-iterate

      // var eof = 60;
      var eof = lines.length;
      for (var i = 0; i < eof; i++) {
        line = lines[i].replace(/\r?\n|\r/g,'');
        if (isComment(line)) { continue; }
        if (isDate(line)) {
          currentDate = line;
        } else if (isTask(line)) {
          var task = parseTask(line,i);
          parsley.tasks.push(task);
          updateStats(task);
        } else if (isTarget(line)) {
          //syntax doesn't specify or even care about a YEAR yet, but should.
          line = line.split(' ');
          var interval = line[0];
          var target = line[1];
          //bleh, need to figure out how to both: 
          //1. Always prioritize a month target over an arc definition
          //2. Prioritize the top most value in the file, at least until I sort everything.
          var arcNameIndex = "Beginning Middle End".split(' ').indexOf(interval)
          if (arcNameIndex != -1 ) {
            for (var j = 0; j < 4; j++) {
              interval = monthName(j+arcNameIndex*4);
              parsley.targets[interval] = parsley.targets[interval] || target;
            }
          } else {
            // parsley.targets[interval] = parsley.targets[interval] || target;
            parsley.targets[interval] = target;
          }
        } else if (isTagDefinition(line)) {
          var tag = line[0];
          //first tag in file gets priority
          //later, there will be multiple passes
          parsley.tags[tag] = parsley.tags[tag] || line.slice(2,line.length);
          //unaccounted-for line
        }
      }

      // p(Object.keys(parsley.stats));
      // console.log(parsley.stats['year']);
      return parsley;

      function updateStats(task) {
        statsKeys.forEach(function (key) {
          var value = task[key];
          parsley.stats[key][value] = parsley.stats[key][value] || 0;
          parsley.stats[key][value] += parseInt(task.duration);
        });
      }

      function parseTask(line,index) {
        var date,
            time,
            tag,
            category,
            subcategory,
            description,
            duration;

        var split = line.split(/\s+|\t+/);
        time = split[0];
        duration = split[split.length-1].replace(/[^Xx]/g,'').length;

        tag = checkTag(split[1]);
        var middle = split.slice((tag?2:1),split.length-1).join(' ').split(':');
        tag = tag || "None";


        var splitDate = currentDate.split('/'),
            year = splitDate[2],
            month = splitDate[0],
            day = splitDate[1];
    

        var splitEndHour = time.split('.'),
            endHours = splitEndHour[0],
            endMinutes = splitEndHour[1] ? "30":"00";

        var startHour = (parseFloat(time)-(0.5)*parseInt(duration)).toString(),
            splitStartHour = startHour.split('.'),
            startHours = splitStartHour[0],
            startMinutes = splitStartHour[1] ? "30":"00";

        var endDate = new Date(year, parseInt(month)-1, day, endHours, endMinutes);
        // p(year+","+month+","+day+","+endHours+","+endMinutes);
        // p(endDate)

        // p(startMinutes);
  
        var startDate = new Date(year, parseInt(month)-1, day, startHours,startMinutes);
        var baseDate = new Date(year,parseInt(month)-1,day);

        if (middle.length >= 2) {
          categories = middle[0].split(/,\s?/);
          category = categories[0];
          subcategory = categories[1] || "None";

          description = middle.slice(1,middle.length).join(' ');
        } else {
          category = "None";
          description = middle.join(' ');
        }
        //make sure to lose the toString() business on refactor
        //... that is, if you can even figure out why they're there to begin with.
        return {
          //lineIndex; rename.
          index: index,
          time: time,
          date: currentDate,
          startDate: startDate,
          endDate: endDate,
          baseDate: baseDate,
          duration: duration,
          category: category,
          subcategory, subcategory,
          tag: tag,
          description: description,
          duration: duration.toString(),
          year: endDate.getFullYear().toString(),
          month: monthName(endDate.getMonth()),
          week: weekNum(endDate.getDate()),

        }

        function checkTag(maybeTag) {
          var definedTags = Object.keys(parsley.tags).join('');
          //this regex is pretty good, but doesn't limit non-consecutive occurrences
          //eg. "EErrEE" would be a false positive.
          var isTag = RegExp("^((["+definedTags+"])\\2?(?!\\2))+$").test(maybeTag);
          return isTag ? maybeTag : null;
        }

      }

    }

    function weekNum(day) {
      var bracket = Math.floor((day-1)/7);
      // p(day + " is Week " + (bracket+1));
      return bracket < 4 ? "Week " + (bracket+1) :"Week Burst"; 

    }

    function monthName(index) {
      return "January February March April May June July August September October November December".split(' ')[index];

    }
    function isTagDefinition(line) {
      return /^[^\d]{1}\s.*/.test(line);
    }
    function isComment(line) {
      return /^#.*/.test(line);
    }

    function isTarget(line) { 
      return /^(January|February|March|April|May|June|July|August|September|October|November|December|Beginning|Middle|End)\s\d+$/.test(line);
    }

    function isDate(line) {
      return /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{1,4}\w*$/.test(line);
    }

    function isTask(line) {
      // return /^([0-9]|[01][0-9]|2[0-4])(\.[0,5]|[\s,\t]).*[\s,\t]((?:\[|\()?X(\]|\))?)+$/.test(line);
      // only change is to match to 39 instead of just to 24.
      return /^([0-9]|[0-3][0-9])(\.[0,5]|[\s,\t]).*[\s,\t]((?:\[|\()?X(\]|\))?)+$/.test(line);
    }

    function countPoms(line) {
      //This can probably be much shorter.
      return line.match(/((\[|\()?X(\]|\))?)+$/)[0].replace(/(\[|\]|\(|\))/g,"").length
    }
  }