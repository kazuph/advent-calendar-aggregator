var scraperjs = require('scraperjs');
var async = require('async');
var rest = require('restler');

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

function getHatebuCount(url, callback) {
    console.log(url);
    rest.get(hatebuApiUrl, {
        query: {
            'url': url
        }
    }).on('complete', function(data, response) {
        data ? console.log(data) : console.log(0);
        // callback(null, data.count);
    });
}

getHatebuCount('http://developer.hatena.ne.jp/ja/documents/bookmark/apis/getcount');

// async.waterfall(
//     [
//         getThemeUrls,
//         function(themes, callback) {
//             async.map([
//                     themes[0],
//                     themes[1],
//                 ],
//                 getEntryUrls,
//                 function(err, themes) {
//                     callback(null, themes);
//                 });
//         }
//     ], function(err, results) {
//         console.log(results);
//     });
