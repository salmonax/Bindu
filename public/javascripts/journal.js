//ToDo: put weekday-related crap into helper functions
function buildJournal(lines) { 
  var journal = { 
    entries: [], 
    dosages: [],
    dayDosageItems: function(date) { 
      //YUCK. this should just be a filter run on journal for the current week.
      var dateOnly = new Date(date.getTime())
      dateOnly.setHours(0,0,0,0)
      var today = journal.dosages.filter( function(dosage) {
        return dosage.date.getTime() == dateOnly.getTime();
      });
      return today.length > 0 ? today[0].items.sort() : [];
    }
  };
  var currentDate;
  var currentYear;
  var inDosage = false;
  var currentDosageSet;
  lines.forEach(function(line,i) {
    line = line.trim();
    // if (i > 300) { return }
    if (isDateLine(line)) {
      currentDate = line;
      // journal.entries.push({ date: line })
    } else if (isDosageHeading(line)) {
      if (line.split('(')[0].trim() == "Start") {
        currentDosageSet = { items: [] };
        // p('--- START DOSAGE DAY ---');
        // p(currentDate);
        inDosage = true;
        var dateString = currentDate.split(/,\s?/);
        var timeString;
        /* Create new Date from date string */
        if (dateString.length > 3) {
          dateString = dateString.slice(0,3).join(', ')
        } else {
          if (!currentYear) { currentYear = new Date().getFullYear().toString() }
          dateString = dateString.slice(0,2).join(', ')+', '+currentYear;
        }
        var currentDosageDate = new Date(Date.parse(dateString));
        currentYear = currentDosageDate.getFullYear();
        /* Extract weekday hint from previous lines */
        var prevLine = (lines[i-3] +' '+ lines[i-2]).replace(/[\n:]/,'');
        var dayHint = /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/.exec(prevLine);
        dayHint = dayHint ? dayHint[0] : null;
        // p(dayHint);
        // p(currentYear);
        /* Fix dosage date according to weekday hint */
        var fixedDay = dayNum(dayHint);
        var oldDay = currentDosageDate.getDay();
        if (fixedDay != null && fixedDay != oldDay) {
          var diff = dayDiff(fixedDay,oldDay);
          currentDosageDate.setDate(currentDosageDate.getDate()-diff);
        }
        currentDosageSet.date = currentDosageDate;
        // p(currentDosageDate);
      }
    } else if (inDosage) {
      if (line.length > 0) {
        // p(line);
        currentDosageSet.items.push(line.replace('*',''));
      } else {
        inDosage = false;
        journal.dosages.push(currentDosageSet);
        // p("---- END DOSAGE DAY ---");
      }
    }
  })
  // p(journal.dosages.map(function(dosage) { return dosage.date; }));
  return journal;
  //this is purely a hack and for my own use. WOOT!
  function isDosageHeading(line) {
    return /^\*?(Start|Middle|End)\s?\(.*(am|pm)-.*(am|pm)\)/.test(line);
  }
  function dayNum(name) {
    var num = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(' ').indexOf(name);
    return num != -1 ? num : null;
  }
  function dayDiff(fixed,old) {
    var diff = old-fixed
    return diff >= 0 ? diff : diff+7;
  }

  function isDateLine(line) {
    return /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s?(January|February|March|April|May|June|July|August|September|October|November|December)\s?\d{1,2}/.test(line);
  }
}