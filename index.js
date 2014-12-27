// for scraper
var scraperjs = require('scraperjs');
var async = require('async');
var rest = require('restler');
var fs = require('fs');
var Url = require('url');

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
    rest.get(hatebuApiUrl, {
        query: {
            'url': entry['url']
        }
    }).on('complete', function(data, response) {
        var count = data ? data : 0;
        console.log(entry['day'] + "日目 " + entry['text'] + ": " + count);
        callback(null, {
            day: entry['day'],
            title: entry['text'],
            url: entry['url'],
            hatebu: count
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
                themeCalendarUrl: theme['themeCalendarUrl'],
                entries: entries
            });
        });
}

// curl https://qiita.com/api/v1/items/ed0957dc45ecdcf3963c | jq ".stock_count"
function getQiitaCount(entry, callback) {
    var url = entry['url'];
    if (Url.parse(url).host === 'qiita.com') {
        var uuid = url.split(/\//)[5];
        rest.get('https://qiita.com/api/v1/items/' + uuid).on('complete', function(data, response) {
            var count = data.stock_count ? data.stock_count : 0;
            console.log(entry['day'] + "日目 " + entry['text'] + ": " + count);
            callback(null, {
                day: entry['day'],
                title: entry['text'],
                url: entry['url'],
                hatebu: entry['hatebu'],
                qiita: count
            });
        });
    }
}

function insertQiitaCount(theme, callback) {
    console.log(theme['themeTitle']);
    var entries = theme['entries'];
    async.map(entries,
        getQiitaCount,
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
        },
        function(results, callback) {
            asyncMap(results, insertQiitaCount, callback);
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
