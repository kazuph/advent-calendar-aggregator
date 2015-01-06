scraperjs = require("scraperjs")
async = require("async")
rest = require("restler")
fs = require("fs")

baseUrl = "http://qiita.com"
hatebuApiUrl = "http://api.b.st-hatena.com/entry.count"

getThemeUrls = (callback) ->
  scraperjs.StaticScraper.create(baseUrl + "/advent-calendar/2014").scrape (($) ->
    $(".adventCalendar_labelContainer a").map(->
      title = $(this).text()
      url = $(this).attr("href")
      unless url.match(/feed$/)
        title: title
        url: url
    ).get()
  ), (themes) ->
    callback null, themes
    return
  return

getEntryUrls = (theme, callback) ->
  themeUrl = theme["url"]
  scraperjs.StaticScraper.create(baseUrl + themeUrl).scrape (($) ->
    $(".adventCalendar_calendar_day").map(->
      day = $(".adventCalendar_calendar_date", this).text()
      text = $(".adventCalendar_calendar_entry a", this).text()
      url = $(".adventCalendar_calendar_entry a", this).attr("href")
      if url isnt `undefined`
        url = baseUrl + url  unless url.match(/^http/)
        day: day
        text: text
        url: url
    ).get()
  ), (entries) ->
    callback null,
      themeTitle: theme["title"]
      themeCalendarUrl: theme["url"]
      entries: entries
    return
  return

getHatebuCount = (entry, callback) ->
  setTimeout (->
    rest.get(hatebuApiUrl,
      query:
        url: entry["url"]
    ).on "complete", (data, response) ->
      if data instanceof Error
        console.log "Error:", data.message
        @retry 5000
      else
        count = (if data then data else 0)

        # console.log(entry['day'] + "日目 " + entry['text'] + ": " + count);
        callback null,
          day: entry["day"]
          title: entry["text"]
          url: entry["url"]
          count: count
      return
    return
  ), 200
  return

insertHatebuCount = (theme, callback) ->
  console.log theme["themeTitle"]
  entries = theme["entries"]
  async.map entries, getHatebuCount, (err, entries) ->
    callback null,
      themeTitle: theme["themeTitle"]
      themeCalendarUrl: theme["themeCalendarUrl"]
      entries: entries
    return
  return

asyncMap = (ary, iter, callback) ->
  async.map ary, iter, (err, results) ->
    callback null, results
    return
  return

async.waterfall [
  getThemeUrls
  (results, callback) ->
    asyncMap results, getEntryUrls, callback
  (results, callback) ->
    asyncMap results, insertHatebuCount, callback
], (err, results) ->
  console.log results
  fs.writeFile "results.json", JSON.stringify(results), (err) ->
    console.log err  if err
    console.log "DONE"
    return
  return

