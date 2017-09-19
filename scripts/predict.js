/**
 * Created by Andy on 9/17/2017.
 */
var map, editToolbar, ctxMenuForGraphics, ctxMenuForMap;
var selected, currentLocation;

var predictFactorReady = 0;

//for debug
var tempvar1, tempvar2, tempvar3;

require([
    "esri/map","esri/tasks/Geoprocessor", "esri/geometry/Point", "esri/geometry/Polygon",
    "esri/toolbars/draw", "esri/toolbars/edit",
    "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/graphic", "esri/geometry/jsonUtils",
    "esri/Color", "dojo/parser",
    "dijit/Menu", "dijit/MenuItem", "dijit/MenuSeparator",
    "dijit/form/Button", "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
    "dojo/domReady!"
], function(
    Map, Geoprocessor, Point, Polygon,
    Draw, Edit,
    SimpleMarkerSymbol, SimpleLineSymbol,
    SimpleFillSymbol,
    Graphic, geometryJsonUtils,
    Color, parser,
    Menu, MenuItem, MenuSeparator) {
    parser.parse();

    var map = new Map("viewDiv", {
        basemap: "topo",
        zoom: 15,
        center: [-122.3321, 47.6062],
        minZoom: 13,
        maxZoom: 17
    });

    var gp_dg = new Geoprocessor("https://localhost:6443/arcgis/rest/services/starbucks/FindDemographicUnder/GPServer/FindDemographicUnder");
    var gp_road = new Geoprocessor("https://localhost:6443/arcgis/rest/services/starbucks/FindNearRoad/GPServer/FindNearRoad");
    var gp_tweets = new Geoprocessor("https://localhost:6443/arcgis/rest/services/starbucks/FindNearTweets/GPServer/FindNearTweets");

    map.on("load", createToolbarAndContextMenu);

    function createToolbarAndContextMenu() {

        // Create and setup editing tools
        editToolbar = new Edit(map);

        map.on("click", function(e) {
            editToolbar.deactivate();
        });

        createMapMenu();
        createGraphicsMenu();
    }

    function createMapMenu() {
        // Creates right-click context menu for map
        ctxMenuForMap = new Menu({
            onOpen: function(box) {
                // Lets calculate the map coordinates where user right clicked.
                // We'll use this to create the graphic when the user clicks
                // on the menu item to "Add Point"
                currentLocation = getMapPointFromMenuPosition(box);
                editToolbar.deactivate();
            }
        });
        ctxMenuForMap.addChild(new MenuItem({
            iconClass: "predict-menu predict-newicon",
            label: "Add potential location",
            onClick: function(e) {
                var symbol = new SimpleMarkerSymbol(
                    SimpleMarkerSymbol.STYLE_CIRCLE, 15,
                    null,
                    new Color([82,158,64])
                );
                var graphic = new Graphic(geometryJsonUtils.fromJson(currentLocation.toJson()), symbol);
                map.graphics.add(graphic);
            }
        }));
        ctxMenuForMap.addChild(new MenuItem({
            iconClass: "predict-menu predict-demoicon",
            label: "Demographic Data",
            onClick: function(e) {

            }
        }));
        ctxMenuForMap.startup();
        ctxMenuForMap.bindDomNode(map.container);
    }

    // Creating a right click context menu for selected location
    function createGraphicsMenu() {
        ctxMenuForGraphics = new Menu({});

        //calculate sales vol by using the algorithm
        ctxMenuForGraphics.addChild(new MenuItem({
            iconClass: "predict-menu predict-predicticon",
            label: "Predict Annual Sales",
            onClick: clickGetDgData,
        }));

        //move selected location
        ctxMenuForGraphics.addChild(new MenuItem({
            iconClass: "predict-menu predict-moveicon",
            label: "Move",
            onClick: function() {
                editToolbar.activate(Edit.MOVE, selected);
            }
        }));

        //show detail demographic info
        ctxMenuForGraphics.addChild(new MenuItem({
            iconClass: "predict-menu predict-demoicon",
            label: "Demographic",
            onClick: function() {
                editToolbar.activate(Edit.MOVE, selected);
            }
        }));

        //remove the selected location
        ctxMenuForGraphics.addChild(new MenuItem({
            iconClass: "predict-menu predict-removeicon",
            label: "Remove Location",
            onClick: function() {
                map.graphics.remove(selected);
            }
        }));

        ctxMenuForGraphics.startup();

        map.graphics.on("mouse-over", function(evt) {
            // We'll use this "selected" graphic to enable editing tools
            // on this graphic when the user click on one of the tools
            // listed in the menu.
            selected = evt.graphic;

            // Let's bind to the graphic underneath the mouse cursor
            ctxMenuForGraphics.bindDomNode(evt.graphic.getDojoShape().getNode());
        });

        map.graphics.on("mouse-out", function(evt) {
            ctxMenuForGraphics.unBindDomNode(evt.graphic.getDojoShape().getNode());
        });
    }

    /* 1. Handling getting demographic data */
    function clickGetDgData(e) {

            var lat = selected.geometry.getLatitude().toFixed(5);
            var lon =selected.geometry.getLongitude().toFixed(5);

            $('#model-lat').text("Latitude:"+ lat);
            $('#model-lon').text("Longitude:"+ lon);

            var params = {
                "displayFieldName": "",
                "geometryType": "esriGeometryPoint",
                "spatialReference": {
                    "wkid": 4326,
                    "latestWkid": 4326
                },
                "fields": [
                    {
                        "name": "FID",
                        "type": "esriFieldTypeOID",
                        "alias": "FID"
                    },
                    {
                        "name": "Id",
                        "type": "esriFieldTypeInteger",
                        "alias": "Id"
                    },
                    {
                        "name": "NEAR_FID",
                        "type": "esriFieldTypeInteger",
                        "alias": "NEAR_FID"
                    },
                    {
                        "name": "NEAR_DIST",
                        "type": "esriFieldTypeDouble",
                        "alias": "NEAR_DIST"
                    }
                ],
                "features": [{
                    "attributes": {
                        "FID": 0,
                        "Id": 0,
                        "NEAR_FID": 178743,
                        "NEAR_DIST": 4.10880605353E-4
                    },
                    "geometry": {
                        "x": lon,
                        "y": lat,
                    }
                }],
                "exceededTransferLimit": false
            };
            $("#cal-location").click(function () {

                $(".predict-factor").hide();
                $(".predict-loading").show();

                gp_dg.submitJob({
                    "user_point": params,
                }, completeDgdataRequest, checkDgStatus);
                gp_road.submitJob({
                    "user_point": params,
                }, completeRoadDistRequest, checkRoadDistStatus);
                gp_tweets.submitJob({
                    "user_point": params,
                }, completeTweetsRequest, checkTweetsStatus);

            });

            $('#predict-box').modal();
    }

    function completeDgdataRequest(jobInfo){
        //console.log("getting data");
        gp_dg.getResultData(jobInfo.jobId, "demographic_result_shp", displayDgResult);
    }

    function displayDgResult(result, messages) {
        console.log(result);
        $('#loading-asiapop').hide();
        $('#loading-avghh').hide();
        $('#asiapop-text').show();
        $('#avghh-text').show();

        // var asiapopu = result.value.features[0].attributes["AsianPopNu"];
        // var avghhold = result.value.features[0].attributes["AvgHouseHo"];
        //
        // //display numbers
        // $('#asiapop-text').text(asiapopu + " asian in the census tract");
        // $('#avghh-text').text("$"+ avghhold + " within the census tract");

        predictFactorReady+=1;
        if(predictFactorReady == 3){
            displayFinalPredict();
        }

        tempvar1 = result;
    }

    function checkDgStatus(jobInfo) {
       // console.log(jobInfo);
    }

    /* 2. Handling getting nearest road */

    function completeRoadDistRequest(jobInfo){

        gp_road.getResultData(jobInfo.jobId, "PointDist", displayRoadDistResult);
    }

    function displayRoadDistResult(result, messages) {
        console.log(result);
        $('#loading-distroad').hide();
        $('#distroad-text').show();
        predictFactorReady+=1;
        if(predictFactorReady == 3){
            displayFinalPredict();
        }
        tempvar2 = result;
    }

    function checkRoadDistStatus(jobInfo){
        //console.log(jobInfo);
    }

    /* 3. Find tweets */
    function completeTweetsRequest(jobInfo){
        gp_tweets.getResultData(jobInfo.jobId, "user_point_SpatialJoin_shp", displayTweetsResult);
    }

    function displayTweetsResult(result, messages) {
        console.log(result);
        $('#loading-numtweets').hide();
        $('#numtweets-text').show();
        predictFactorReady+=1;
        if(predictFactorReady == 3){
            displayFinalPredict();
        }
        tempvar3 = result;
    }

    function checkTweetsStatus(jobInfo){
        //console.log(jobInfo);
    }

    //display final algorithm prediction
    function displayFinalPredict() {
        $('#loading-salevol').hide();
        $('#pred-salesvol').show();
    }
    
    
    // Helper Methods
    function getMapPointFromMenuPosition(box) {
        var x = box.x, y = box.y;
        switch( box.corner ) {
            case "TR":
                x += box.w;
                break;
            case "BL":
                y += box.h;
                break;
            case "BR":
                x += box.w;
                y += box.h;
                break;
        }

        var screenPoint = new Point(x - map.position.x, y - map.position.y);
        return map.toMap(screenPoint);
    }

});

// Algorithm function
function predictAlgo(locationCode, nearRoaddist, avgHouseIncome, numOfTweet, asianPop) {
    var finalpredict;
    var const1 = 117509;
    var const2 = 346718.375;
    var const3 = 1282.303;
    var const4 = 2.208;
    var const5 = 69882.254;
    var const6 = 13.526;

    finalpredict = const1 + const2 * locationCode - const3 * nearRoaddist + const4 * avgHouseIncome + const5 * Math.log10(numOfTweet) + const6 * asianPop;
    return finalpredict;

}