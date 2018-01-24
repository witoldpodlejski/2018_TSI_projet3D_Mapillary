$(document).ready(function () {
    var map = L.map('mapid').setView([57.704077, 12.91286], 13);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(map);

    L.tileLayer('https://d6a1v2w10ny40.cloudfront.net/v0.1/{z}/{x}/{y}.png', {
        maxZoom: 18,
        maxNativeZoom: 17,
        id: 'mapillary.sequences'
    }).addTo(map);

    let layerGroup = L.layerGroup();

    function appendMessage(text) {
        let p = document.createElement("p");
        let now = new Date();
        $(p).text(now.toISOString() + ': ' + text);
        $('#console').append(p);
    }

    function clearMessages(text) {
        $('#console').empty();
    }

    function createPropertyTable(properties) {
        let keys = Object.keys(properties).sort(function(left, right) {
            console.log(left, right, left < right);
            return left < right;
        });

        let table = $('<table class="property-table"></table>');
        table.append($('<tr><th>Property</th><th>Value</th></tr>'));
        for (let key of keys) {
            let value = properties[key];
            let row = $('<tr></tr>');
            row.append($('<td></td>').text(key));
            row.append($('<td></td>').text(value));
            table.append(row);
        }
        return table[0];
    }

    $('#go').click(function () {
        appendMessage('requesting...');
        $.get($('#url').val())
            .then(function (data) {
                if (data.type === 'FeatureCollection') {
                    appendMessage('Got a FeatureCollection with ' + data.features.length + ' feature(s)');
                    if (data.features.length === 0) {
                        return;
                    }
                } else if (data.type === 'Feature') {
                    appendMessage('Got a ' + data.geometry.type + ' feature');
                }

                if (data.type === 'Feature' || data.type === 'FeatureCollection') {
                    let layer = L.geoJSON(data).bindPopup(function (layer) {
                        return createPropertyTable(layer.feature.properties);
                    }).addTo(map);
                    layerGroup.addLayer(layer);
                    map.flyToBounds(layer.getBounds());
                }
            }).catch(function(error) {
                appendMessage(error.status + ': ' + JSON.stringify(error.responseJSON));
            });
    });

    $('#clear').click(function () {
        layerGroup.eachLayer(function (layer) {
            layer.removeFrom(map);
        });
        layerGroup.clearLayers();
        clearMessages();
    });

    $("[name='resource_type']").click(function () {
        $('#url').val('https://a.mapillary.com/v3/' + $(this).val() + '?client_id=TG1sUUxGQlBiYWx2V05NM0pQNUVMQTo2NTU3NTBiNTk1NzM1Y2U2');
    });
});