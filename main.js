$(function() {

    var allDataLength = 30;

    $.getJSON("results.json", function(json) {
        var themes = _.map(json, function(theme, index, list) {
            var hatebuCounts = _.map(theme['entries'],
                function(entry, index, list) {
                    return parseInt(entry['count'], 10);
                })

            var hatebuCountSum = _.reduce(hatebuCounts,
                function(memo, num) {
                    return memo + num;
                }, 0)

            var baseUrl = 'http://qiita.com';

            return {
                id: index,
                title: theme['themeTitle'],
                url: baseUrl + theme['themeCalendarUrl'],
                hatebuCountSum: hatebuCountSum,
                entryCount: theme['entries'].length,
                chartData: {
                    chart: {
                        type: 'bar'
                    },
                    title: {
                        text: '日付ごとのはてブ数',
                    },
                    xAxis: {
                        tickWidth: 0,
                        gridLineWidth: 1,
                        title: {
                            text: '日付'
                        },
                        categories: _.range(1, 26)
                    },
                    yAxis: {
                        title: {
                            text: 'はてブ数'
                        },
                    },
                    tooltip: {
                        shared: true,
                        useHTML: true,
                        formatter: function() {
                            return '<b>' + this.x +
                                '日目 ' + this.y + 'はてブ</b>';
                        }
                    },
                    series: [{
                        name: "はてブ数",
                        data: hatebuCounts
                    }]
                }
            };
        });

        themes = _.sortBy(themes, function(theme) {
            return theme['hatebuCountSum']
        }).reverse();

        new Ractive({
            el: 'graphs',
            template: '#ranking-graph',
            data: {
                themes: themes.slice(0, allDataLength)
            }
        });

        new Ractive({
            el: 'ranking',
            template: '#ranking-list',
            data: {
                themes: themes.slice(30, -1)
            }
        });

        // グラフの表示
        themes = themes.slice(0, allDataLength);
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
        for (var i = 0; i < themes.length; i++) {
            $('.ct-chart.id-' + themes[i]['id']).highcharts(themes[i]['chartData']);
        }

    });
});
