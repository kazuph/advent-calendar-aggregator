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
                entries: entries
            });
        })
}

function getHatebuCount(entry, callback) {
    rest.get(hatebuApiUrl, {
        query: {
            'url': entry['url']
        }
    }).on('complete', function(data, response) {
        var count = data ? data : 0;
        callback(null, {
            day: entry['day'],
            title: entry['text'],
            url: entry['url'],
            count: count
        });
    });
}

function insertHatebuCount(theme, callback) {
    console.log(theme['themeTitle']);
    var entries = theme['entries'];
    async.map(entries,
        getHatebuCount,
        function(err, entries) {
            callback(null, {
                themeTitle: theme['themeTitle'],
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
            console.log(err);
        });

    });
