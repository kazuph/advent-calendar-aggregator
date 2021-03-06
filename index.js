// for scraper
var scraperjs = require('scraperjs');
var async = require('async');
var rest = require('restler');
var fs = require('fs');

var baseUrl = 'http://qiita.com';
var hatebuApiUrl = 'http://api.b.st-hatena.com/entry.count';

function getThemeUrls(callback) {
    scraperjs.StaticScraper.create(baseUrl + '/advent-calendar/2014')
        .scrape(function($) {
            return $(".adventCalendar_labelContainer a").map(function() {
                var title = $(this).text();
                var url = $(this).attr('href');
                if (!url.match(/feed$/)) {
                    return {
                        title: title,
                        url: url
                    };
                }
            }).get();
        }, function(themes) {
            callback(null, themes);
        })
}

function getEntryUrls(theme, callback) {
    var themeUrl = theme['url'];
    scraperjs.StaticScraper.create(baseUrl + themeUrl)
        .scrape(function($) {
            return $(".adventCalendar_calendar_day").map(function() {
                var day = $(".adventCalendar_calendar_date", this).text();
                var text = $(".adventCalendar_calendar_entry a", this).text();
                var url = $(".adventCalendar_calendar_entry a", this).attr("href");
                if (url !== undefined) {
                    if (!url.match(/^http/)) {
                        url = baseUrl + url;
                    }
                    return {
                        day: day,
                        text: text,
                        url: url
                    };
                }
            }).get();
        }, function(entries) {
            callback(null, {
                themeTitle: theme['title'],
                themeCalendarUrl: theme['url'],
                entries: entries
            });
        })
}

function getHatebuCount(entry, callback) {
    setTimeout(function() {
        rest.get(hatebuApiUrl, {
            query: {
                'url': entry['url']
            }
        }).on('complete', function(data, response) {
            if (data instanceof Error) {
                console.log('Error:', data.message);
                this.retry(5000);
            } else {
                var count = data ? data : 0;
                // console.log(entry['day'] + "日目 " + entry['text'] + ": " + count);
                callback(null, {
                    day: entry['day'],
                    title: entry['text'],
                    url: entry['url'],
                    count: count
                });
            }
        });
    }, 200);
}

function insertHatebuCount(theme, callback) {
    console.log(theme['themeTitle']);
    var entries = theme['entries'];
    async.map(entries,
        getHatebuCount,
        function(err, entries) {
            callback(null, {
                themeTitle: theme['themeTitle'],
                themeCalendarUrl: theme['themeCalendarUrl'],
                entries: entries
            });
        });
}

function asyncMap(ary, iter, callback) {
    async.map(ary, iter, function(err, results) {
        callback(null, results);
    });
}

async.waterfall(
    [
        getThemeUrls,
        function(results, callback) {
            asyncMap(results, getEntryUrls, callback);
        },
        function(results, callback) {
            asyncMap(results, insertHatebuCount, callback);
        }
    ], function(err, results) {
        console.log(results);
        fs.writeFile('results.json', JSON.stringify(results), function(err) {
            if (err) {
                console.log(err);
            }
            console.log("DONE");
        });
    });
