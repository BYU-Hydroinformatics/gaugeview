//loads modal on page load
$(document).ready(function () {
    $("#welcome-popup").modal("show");
});

var comid;
function dataCall(inputURL) {
    var result = null;
        $.ajax({
        url: inputURL,
        async: false,
        }).then(function(response) {
            result = response;
        });
        return result;
}

//Map variables
var selected_streams_layer;

//Here we are declaring the projection object for Web Mercator
var projection = ol.proj.get('EPSG:3857');

// Define Basemap
// Here we are declaring the raster layer as a separate object to put in the map later
var baseLayer = new ol.layer.Tile({
    source: new ol.source.BingMaps({
        key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
        imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
        })
    });

// If you desired to use the OSM basemap
//var baseLayer = new ol.layer.Tile({
//    source: new ol.source.OSM({})
//});

// as of July 11, 2016 Mapquest is no longer accessible See: goo.gl/xB0xXt
//var baseLayer = new ol.layer.Tile({
//    source: new ol.source.MapQuest({layer: 'osm'})
//});


//Define all WMS Sources:

// Highlight selected stream
    var createLineStyleFunction = function() {
        return function(feature, resolution) {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#ffff00',
                    width: 2
                }),
////                This is another way to display the COMID
//                text: new ol.style.Text({
//                    textAlign: 'center',
//                    textBaseline: 'middle',
//                    font: 'bold 12px Verdana',
//                    text: getText(feature, resolution),
//                    fill: new ol.style.Fill({color: '#cc00cc'}),
//                    stroke: new ol.style.Stroke({color: 'black', width: 0.5})
//                })
            });
            return [style];
        };
    };

    var getText = function(feature, resolution) {
        var maxResolution = 100;
        var text = feature.get('name');
        if (resolution > maxResolution) {
            text = '';
        }
        return text;
    };

    selected_streams_layer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: createLineStyleFunction()
    });

//Add all stream reaches to map, only viewable when zoomed in
var serviceUrl = 'https://watersgeo.epa.gov/arcgis/rest/services/NHDPlus_NP21/NHDSnapshot_NP21_Labeled/MapServer/0';
// var serviceUrl = 'http://geoserver.byu.edu/arcgis/rest/services/NWC/NWM_Geofabric/MapServer/1';
var esrijsonFormat = new ol.format.EsriJSON();
var vectorSource = new ol.source.Vector({
        loader: function(extent, resolution, projection) {
            var url = serviceUrl + '/query/?f=json&geometry=' +
                '{"xmin":' + extent[0] + ',"ymin":' + extent[1] + ',"xmax":' + extent[2] + ',"ymax":' + extent[3] +
                ',"spatialReference":{"wkid":102100}}&inSR=102100&outSR=102100';
            $.ajax({url: url, dataType: 'jsonp', success: function(response) {
                if (response.error) {
                    alert(response.error.message + '\n' +
                        response.error.details.join('\n'));
                } else {
                    // dataProjection will be read from document
                    var features = esrijsonFormat.readFeatures(response, {
                        featureProjection: projection
                    });
                    if (features.length > 0) {
                        vectorSource.addFeatures(features);
                    }
                }
            }});
        },
        strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
            tileSize: 512
        }))
    });

all_streams_layer = new ol.layer.Vector({
        source: vectorSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#0000ff',
                width: 2
            })
        }),
        maxResolution: 100
    });

////map.addLayer(all_streams_layer);
//var AHPS_Source =  new ol.source.TileWMS({
//        url:'http://tethys.byu.edu:8181/geoserver/wms',
//        params:{
//            LAYERS:"gaugeviewwml:AHPS_Gauges",
////            FORMAT:"image/png", //Not a necessary line, but maybe useful if needed later
//        },
//        crossOrigin: 'Anonymous' //This is necessary for CORS security in the browser
//        });
//
//var USGS_Source =  new ol.source.TileWMS({
//        url:'http://tethys.byu.edu:8181/geoserver/wms',
//        params:{
//            LAYERS:"gaugeviewwml:Export_USGS0",
////            FORMAT:"image/png", //Not a necessary line, but maybe useful if needed later
//        },
//        crossOrigin: 'Anonymous'
//        });

var AHPS_Source =  new ol.source.TileWMS({
        url:'https://geoserver.byu.edu/arcgis/services/gaugeviewer/AHPS_gauges/MapServer/WmsServer?',
        params:{
            LAYERS:"0",
//            FORMAT:"image/png", //Not a necessary line, but maybe useful if needed later
        },
        crossOrigin: 'Anonymous' //This is necessary for CORS security in the browser
        });

var USGS_Source =  new ol.source.TileWMS({
        url:'https://geoserver.byu.edu/arcgis/services/gaugeviewer/USGS_gauges/MapServer/WmsServer?',
        params:{
            LAYERS:"0",
//            FORMAT:"image/png", //Not a necessary line, but maybe useful if needed later
        },
        crossOrigin: 'Anonymous'
        });

//Define all WMS layers
//The gauge layers can be changed to layer.Image instead of layer.Tile (and .ImageWMS instead of .TileWMS) for a single tile
var AHPS_Gauges = new ol.layer.Tile({
    source:AHPS_Source
    }); //Thanks to http://jsfiddle.net/GFarkas/tr0s6uno/ for getting the layer working

var USGS_Gauges = new ol.layer.Tile({
    source:USGS_Source
    }); //Thanks to http://jsfiddle.net/GFarkas/tr0s6uno/ for getting the layer working

//Set opacity of layers
//AHPS_Gauges.setOpacity(0.7);
//USGS_Gauges.setOpacity(0.7);

sources = [AHPS_Source,USGS_Source];
layers = [baseLayer, all_streams_layer, selected_streams_layer, AHPS_Gauges, USGS_Gauges];

//Establish the view area. Note the reprojection from lat long (EPSG:4326) to Web Mercator (EPSG:3857)
var view = new ol.View({
        center: [-11500000, 4735000],
        projection: projection,
        zoom: 4,
    })

//Declare the map object itself.
var map = new ol.Map({
    target: document.getElementById("map"),
    layers: layers,
    view: view,
});

//Zoom slider
map.addControl(new ol.control.ZoomSlider());

var element = document.getElementById('popup');

var popup = new ol.Overlay({
  element: element,
  positioning: 'bottom-center',
  stopEvent: true
});

map.addOverlay(popup);

function run_geocoder(){
        g = new google.maps.Geocoder();
        search_location = document.getElementById('location_input').value;
        g.geocode({'address':search_location},geocoder_success);
    };

function geocoder_success(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
        r=results;
        flag_geocoded=true;
        Lat = results[0].geometry.location.lat();
        Lon = results[0].geometry.location.lng();
        var dbPoint = {
            "type": "Point",
            "coordinates": [Lon, Lat]
        }

        var coords = ol.proj.transform(dbPoint.coordinates, 'EPSG:4326','EPSG:3857');
        map.getView().setCenter(coords);
        map.getView().setZoom(12);
    } else {
        alert("Geocode was not successful for the following reason: " + status);
    };
};

function reverse_geocode(coord){
    var latlon = new google.maps.LatLng(coord[1],coord[0]);
    var g = new google.maps.Geocoder();
    g.geocode({'location':latlon}, reverse_geocode_success);
};

function reverse_geocode_success(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
        var location = results[1].formatted_address;
        if (gnis_name != null) {
            location = gnis_name + ", " + location;
        }

    } else {
        document.getElementById("location_input").value = "Location Not Available";
    }
};

function handle_search_key(e) {
    // Handle a key press in the location search text box.
    // This handles pressing the enter key to initiate the search.
    if (e.keyCode == 13) {
        run_geocoder();
    }
};

//find current date
var date = new Date();

var yyyy = date.getFullYear().toString();
var mm = (date.getMonth()+1).toString();
var dd  = date.getDate().toString();

var mmChars = mm.split('');
var ddChars = dd.split('');

var datestringnow = yyyy + '-' + (mmChars[1]?mm:"0"+mmChars[0]) + '-' + (ddChars[1]?dd:"0"+ddChars[0]);

function run_point_indexing_service(lonlat){
    var inputLon = lonlat[0];
    var inputLat = lonlat[1];
    var wktval = "POINT(" + inputLon + " " + inputLat + ")";
    var options = {
        "success" : "pis_success",
        "error"   : "pis_error",
        "timeout" : 60 * 1000
    };
var data = {
        "pGeometry": wktval,
        "pGeometryMod": "WKT,SRSNAME=urn:ogc:def:crs:OGC::CRS84",
        "pPointIndexingMethod": "DISTANCE",
        "pPointIndexingMaxDist": 10,
        "pOutputPathFlag": "TRUE",
        "pReturnFlowlineGeomFlag": "FULL",
        "optOutCS": "SRSNAME=urn:ogc:def:crs:OGC::CRS84",
        "optOutPrettyPrint": 0,
        "optClientRef": "CodePen"
    };
    WATERS.Services.PointIndexingService(data, options);
}

// Stream network
function pis_success(result) {
    var srv_rez = result.output;
    if (srv_rez == null) {
        if ( result.status.status_message !== null ) {
            report_failed_search(result.status.status_message);
        } else {
            report_failed_search("No reach located near your click point.");
        }
        return;
    }

    var srv_fl = result.output.ary_flowlines;
    var newLon = srv_fl[0].shape.coordinates[Math.floor(srv_fl[0].shape.coordinates.length/2)][0];
    var newLat = srv_fl[0].shape.coordinates[Math.floor(srv_fl[0].shape.coordinates.length/2)][1];
    comid = srv_fl[0].comid.toString();
    $('#longInput').val(newLon);
    $('#latInput').val(newLat);
    $('#comidInput').val(comid);

    //add the selected flow line to the map
    for (var i in srv_fl) {
        selected_streams_layer.getSource().clear()
        selected_streams_layer.getSource().addFeature(geojson2feature(srv_fl[i].shape));
    }
}

function pis_success2(result) {
    var srv_fl = result.output.ary_flowlines;
    var newLon = srv_fl[0].shape.coordinates[Math.floor(srv_fl[0].shape.coordinates.length/2)][0];
    var newLat = srv_fl[0].shape.coordinates[Math.floor(srv_fl[0].shape.coordinates.length/2)][1];
    comid = srv_fl[0].comid.toString();

    //add the selected flow line to the map
    for (var i in srv_fl) {
        selected_streams_layer.getSource().clear()
        selected_streams_layer.getSource().addFeature(geojson2feature(srv_fl[i].shape));
    }
}

function pis_error(XMLHttpRequest, textStatus, errorThrown) {
    report_failed_search(textStatus);
}

function geojson2feature(myGeoJSON) {
    //Convert GeoJSON object into an OpenLayers 3 feature.
    //Also force jquery coordinates into real js Array if needed
    var geojsonformatter = new ol.format.GeoJSON;
    if (myGeoJSON.coordinates instanceof Array == false) {
        myGeoJSON.coordinates = WATERS.Utilities.RepairArray(myGeoJSON.coordinates,0);
    }
    var myGeometry = geojsonformatter.readGeometry(myGeoJSON);
    myGeometry.transform('EPSG:4326','EPSG:3857');
    //name the feature according to COMID
    var newFeatureName = 'COMID: ' + comid;

    return new ol.Feature({
        geometry: myGeometry,
        name: newFeatureName
    });
}

function clearErrorSelection() {
    var numFeatures = selected_streams_layer.getSource().getFeatures().length;
    var lastFeature = selected_streams_layer.getSource().getFeatures()[numFeatures-1];
    selected_streams_layer.getSource().removeFeature(lastFeature);
}

//Find the gaugeid and waterbody when using the generate new graph button
$(function () {
    $('#gaugeid').val(window.location.search.split('&')[0].split('=')[1])
});

//Click funtion to choose gauge on map
map.on('singleclick', function(evt) {
    $(element).popover('destroy');
        if (map.getTargetElement().style.cursor == "pointer"){

            var clickCoord = evt.coordinate;
            popup.setPosition(clickCoord);
            lonlat = ol.proj.transform(clickCoord, 'EPSG:3857', 'EPSG:4326');
            run_point_indexing_service(lonlat);
            var view = map.getView();
            var viewResolution = view.getResolution();

// NEED TO MAKE THIS ONLY CREATE URL IF NECESSARY!!!
            if (document.getElementById("ch_AHPS_Gauges").checked){
                var AHPS_url = AHPS_Source.getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(),
                  {'INFO_FORMAT': 'text/xml', 'FEATURE_COUNT': 50});
            };

            if (document.getElementById("ch_USGS_Gauges").checked){
                var USGS_url = USGS_Source.getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(),
                  {'INFO_FORMAT': 'text/xml', 'FEATURE_COUNT': 50});
              };

            //var displayContent = '<table border="1"><tbody><tr><th>Gauge Type & ID</th><th>Waterbody</th><th>Info</th><th>Link</th></tr>';
            var displayContent = "COMID: " + comid;
            if (AHPS_url) {
                var AHPS_Data = dataCall(AHPS_url);
                var AHPS_Count = AHPS_Data.documentElement.childElementCount;

                //This is for AHPS Gauges (set i=0 if using geoserver.byu.edu, set i=1 if using tethys.byu.edu's geoserver)
                for (i = 0; i < AHPS_Count; i++) {
                    var gaugeID = AHPS_Data.documentElement.children[i].attributes['GaugeLID'].value;
                    var waterbody = AHPS_Data.documentElement.children[i].attributes['Waterbody'].value;
                    var urlLink = AHPS_Data.documentElement.children[i].attributes['URL'].value;
                    var lat = AHPS_Data.documentElement.children[i].attributes['Latitude'].value;
                    var long = AHPS_Data.documentElement.children[i].attributes['Longitude'].value;

//                    var gaugeID = AHPS_Data.documentElement.children[i].children[0].children[1].innerHTML;
//                    var waterbody = AHPS_Data.documentElement.children[i].children[0].children[5].innerHTML;
//                    var urlLink = AHPS_Data.documentElement.children[i].children[0].children[8].innerHTML;
//                    var lat = AHPS_Data.documentElement.children[i].children[0].children[3].innerHTML;
//                    var long = AHPS_Data.documentElement.children[i].children[0].children[4].innerHTML;

                    var ahpshtml = "/apps/gaugeview/ahps/?gaugeno=" + gaugeID + "&waterbody=" + waterbody + "&lat=" + lat + "&long=" + long + "&initial=True";
                    displayContent += '<tr><td>AHPS:\n' + gaugeID + '</td><td>' + waterbody + '</td><td><a href="'+ahpshtml+'" target="_blank">View Data</a></td><td><a href="'+urlLink+'" target="_blank">Go to Website</a></td></tr>';
                    }
                };

            if (USGS_url) {
                var USGS_Data = dataCall(USGS_url);
                var USGS_Count = USGS_Data.documentElement.childElementCount;

                //find two weeks ago date
                var date_old = new Date();

                //document.write(date_old.toLocaleString());
                date_old.setDate(date_old.getDate() - 14);

                //document.write(date_old.toLocaleString());
                date_str = date_old.toISOString();
                var two_weeks_ago_str = date_str.split('T')[0]

                //console.log(date_old)

                //This is for USGS Gauges (set i=0 if using geoserver.byu.edu, set i=1 if using tethys.byu.edu's geoserver)
                for (i = 0; i < USGS_Count; i++) {
                    var gaugeID = USGS_Data.documentElement.children[i].attributes['STAID'].value;
                    var waterbody = USGS_Data.documentElement.children[i].attributes['STANAME'].value;
                    var urlLink = USGS_Data.documentElement.children[i].attributes['NWISWEB'].value;
                    var lat = USGS_Data.documentElement.children[i].attributes['LAT_GAGE'].value;
                    var long = USGS_Data.documentElement.children[i].attributes['LNG_GAGE'].value;

//                    var gaugeID = USGS_Data.documentElement.children[i].attributes['SITE_NO'].value;
//                    var waterbody = USGS_Data.documentElement.children[i].attributes['STATION_NM'].value;
//                    var urlLink = USGS_Data.documentElement.children[i].attributes['NWISWEB'].value;
//                    var lat = USGS_Data.documentElement.children[i].attributes['LAT_SITE'].value;
//                    var long = USGS_Data.documentElement.children[i].attributes['LON_SITE'].value;

//                    var gaugeID = USGS_Data.documentElement.children[i].children[0].children[2].innerHTML;
//                    var waterbody = USGS_Data.documentElement.children[i].children[0].children[3].innerHTML;
//                    var urlLink = USGS_Data.documentElement.children[i].children[0].children[16].innerHTML;
//                    var lat = USGS_Data.documentElement.children[i].children[0].children[8].innerHTML;
//                    var long = USGS_Data.documentElement.children[i].children[0].children[9].innerHTML;

                    var usgshtml = "/apps/gaugeview/usgs/?gaugeid=" + gaugeID + "&waterbody=" + waterbody + "&start=" + two_weeks_ago_str + "&end=" + datestringnow + "&lat=" + lat + "&long=" + long + "&initial=True";
                    displayContent += '<tr><td>USGS:\n' + gaugeID +'</td><td>'+ waterbody + '</td><td><a href="'+usgshtml+'" target="_blank">View Data</a></td><td><a href="'+urlLink+'" target="_blank">Go to Website</a></td></tr>';
                    }
                };
                    displayContent += '</table>';

                $(element).popover({
                'placement': 'top',
                'html': true,
                'content': displayContent
                  });

                $(element).popover('show');
                $(element).next().css('cursor','text');
//                console.log(displayContent);
            }
        });

  map.on('pointermove', function(evt) {
    if (evt.dragging) {
      return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var hit = map.forEachLayerAtPixel(pixel, function(layer) {
    if (layer != baseLayer){
      return true;}
    });
    map.getTargetElement().style.cursor = hit ? 'pointer' : '';
  });


//This function is ran to set a listener to update the map size when the navigation pane is opened or closed
(function () {
    var target, observer, config;
    // select the target node
    target = $('#app-content-wrapper')[0];

    observer = new MutationObserver(function () {
        window.setTimeout(function () {
            map.updateSize();
        }, 350);
    });

    config = {attributes: true};

    observer.observe(target, config);
}());

if (window.location.pathname == '/apps/gaugeview/') {
    var trigger_search = document.getElementById("location_input");

    trigger_search.addEventListener("keydown",function(e) {
        // Handle a key press in the location search text box.
        // This handles pressing the enter key to initiate the search.
        if (e.keyCode == 13) {
            run_geocoder();
        }
    });
    }

if (window.location.search.includes('timezone')) {
    var query = window.location.search.split("&");

    var qTimezone = query[11].substring(query[11].lastIndexOf());
    console.log(qTimezone);
    timezone = qTimezone.split('=');
    timezone_name = timezone[1];
//    console.log(timezone_name);
}
else {
    timezone_name = 'Coordinated Time';
//    console.log(timezone_name);
}
