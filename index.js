var scraperjs = require('scraperjs');
var async = require('async');
var baseUrl = 'http://qiita.com';

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

function getEntryUrls(themeUrl, callback) {
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
        }, function(urls) {
            callback(null, urls);
        })
}

async.waterfall(
    [
        getThemeUrls
    ], function(err, themes) {
        console.log(themes);
        async.map([themes[0]['url']],
            getEntryUrls,
            function(err, urls) {
                console.log(urls);
            });
    });
