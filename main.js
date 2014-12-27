$(function() {

    var allDataLength = 20;
    var qiitaUrl = 'http://qiita.com';

    $.getJSON("results.json", function(json) {
        var themes = _.map(json, function(theme, index, list) {
            var hatebuCountSum = _.reduce(_.map(theme['entries'],
                function(entry, index, list) {
                    return parseInt(entry['count'], 10);
                }),
                function(memo, num) {
                    return memo + num;
                }, 0)

            return {
                id: index,
                title: theme['themeTitle'],
                url: qiitaUrl + theme['themeCalendarUrl'],
                hatebuCountSum: hatebuCountSum,
                entryCount: theme['entries'].length
            };
        });

        themes = _.sortBy(themes, function(theme) {
            return theme['hatebuCountSum']
        }).reverse();

        // ランキングリスト表示
        new Ractive({
            el: 'ranking-list',
            template: '#ranking-list-tmpl',
            data: {
                themes: themes
            }
        });

        // グラフの表示
        $('#all-chart').highcharts({
            chart: {
                type: 'bar'
            },
            title: {
                text: '各テーマ毎のはてブ数の合計',
            },
            xAxis: {
                tickWidth: 0,
                gridLineWidth: 1,
                maxTickInterval: 1,
                title: {
                    text: 'テーマ'
                },
                categories: _.map(themes, function(theme) {
                    return theme['title']
                })
            },
            yAxis: {
                title: {
                    text: 'はてブ数合計'
                }
            },
            series: [{
                name: 'はてブ数合計',
                data: _.map(themes, function(theme) {
                    return theme['hatebuCountSum']
                })
            }]
        });
    });
});
