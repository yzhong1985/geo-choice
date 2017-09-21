/**
 * Created by Andy on 9/17/2017.
 */
var map, editToolbar, ctxMenuForGraphics, ctxMenuForMap;
var selected, currentLocation;

var predictFactorReady = 0;
var thislocation_nearRd = 0;
var thislocation_asiaPop = 0;
var thislocation_avgIncome = 0;
var thislocation_tweetsCt = 0;

var thislocation_lon=0;
var thislocation_lat=0;
var location_dict = {};

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

    var url_dg = "http://134.173.236.10:6080/arcgis/rest/services/starbucksmart/FindDGUnder/GPServer/FindDemographicUnder/execute";
    var url_tweets = "http://134.173.236.10:6080/arcgis/rest/services/starbucksmart/FindNearTweets/GPServer/FindNearTweets/execute";
    var url_nearRoad = "http://134.173.236.10:6080/arcgis/rest/services/starbucksmart/FindNearRoad/GPServer/FindNearRoad/execute"

    map.on("load", createToolbarAndContextMenu);

    function createToolbarAndContextMenu() {

        // Create and setup editing tools
        editToolbar = new Edit(map);

        map.on("click", function(e) {
            editToolbar.deactivate();
        });

        createMapMenu();
        createGraphicsMenu();
        bindEvents();

    }

    function bindEvents() {
        //when click calculation, get four factors from geoservices
        $("#cal-location").click(function () {

            $(".predict-factor").hide();
            $(".predict-loading").show();


            var dgurl = buildDGUrl(thislocation_lon, thislocation_lat);
            var tweetsurl = buildTweetsUrl(thislocation_lon, thislocation_lat);
            var roadurl = buildNearRDUrl(thislocation_lon, thislocation_lat);

            //sending get requests to server..
            //for some reason, the post request dosen't work, so has to use get, which should be fixed in future.
            $.get( dgurl, null).done(displayDgResult);
            $.get( tweetsurl, null).done(displayTweetsResult);
            $.get( roadurl, null).done(displayRoadDistResult);
        });
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
            onClick: clickGetFactsData,
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
            onClick: clickGetDgData,
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

    function clickGetFactsData(e) {

            resetPredictUI();

            var lat = selected.geometry.getLatitude().toFixed(5);
            var lon =selected.geometry.getLongitude().toFixed(5);

            $('#model-lat').text("Latitude:"+ lat);
            $('#model-lon').text("Longitude:"+ lon);

            thislocation_lon = lon;
            thislocation_lat = lat;

            $('#predict-box').modal();

    }

    function clickGetDgData(e) {

        var lat = selected.geometry.getLatitude().toFixed(5);
        var lon =selected.geometry.getLongitude().toFixed(5);

        $('#model-lat').text("Latitude:"+ lat);
        $('#model-lon').text("Longitude:"+ lon);

        thislocation_lon = lon;
        thislocation_lat = lat;

        $('#demographic-box').modal();
    }

    /* 1. Handling getting demographic data */
    function displayDgResult(result) {
        //console.log(result);
        $('#loading-asiapop').hide();
        $('#loading-avghh').hide();
        $('#asiapop-text').show();
        $('#avghh-text').show();

        var result_json = JSON.parse(result);
        var asiapopu = result_json.results[0].value.features[0].attributes["AsianPopNu"];
        var avghhold = result_json.results[0].value.features[0].attributes["AvgHouseHo"];

         //display numbers
         $('#asiapop-text').text(asiapopu + " asian in the census tract");
         $('#avghh-text').text("$"+ numberWithCommas(avghhold) + " within the census tract");
         //assign to globe vars
        thislocation_asiaPop = asiapopu;
        thislocation_avgIncome = avghhold;
        displayFinalPredict();

    }

    /* 2. Handling getting nearest road */
    function displayRoadDistResult(result) {
        //console.log(result);
        $('#loading-distroad').hide();
        $('#distroad-text').show();
        var result_json = JSON.parse(result);
        var roaddist = result_json.results[0].value.features[0].attributes["NEAR_DIST"];
        roaddist = roaddist * 100000; //convert to meters
        //display on the form
        $('#distroad-text').text(roaddist.toFixed(3) + " meters to nearest road");
        //assign to globe var
        thislocation_nearRd = roaddist;

        displayFinalPredict();

    }

    /* 3. Find tweets */
    function displayTweetsResult(result) {
        //console.log(result);
        $('#loading-numtweets').hide();
        $('#numtweets-text').show();
        var result_json = JSON.parse(result);
        var tweetcount = result_json.results[0].value.features[0].attributes["Join_Count"];
        //display on the form
        $('#numtweets-text').text(tweetcount + " tweets in 100 meter buffer");
        //assign to globe var
        thislocation_tweetsCt = tweetcount;

        displayFinalPredict();

    }

    //display final algorithm prediction
    function displayFinalPredict() {

        predictFactorReady+=1;
        if(predictFactorReady == 3){
            $('#loading-salevol').hide();
            $('#pred-salesvol').show();
            var location_code = $("#loc-select").val();
            var salesvol = predictAlgo(location_code, thislocation_nearRd, thislocation_avgIncome, thislocation_tweetsCt, thislocation_asiaPop);
            $('#pred-salesvol').text('$ '+numberWithCommas(salesvol.toFixed(0)));

            //push the location to a page dict
            var thislocation = {
                location_code: location_code,
                road_dist: thislocation_nearRd,
                avg_income: thislocation_avgIncome,
                tweets_ct: thislocation_tweetsCt,
                asian_pop:thislocation_asiaPop,
                sales_predict:salesvol
            };
            var key = thislocation_lon.toString() + thislocation_lat.toString();
            if(location_dict[key]==null){
                location_dict[key] = thislocation;
            }

            cleanGlobeVars();
        }

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

    //This function helps to generate the get url for Demographic data
    function buildDGUrl (lon, lat){
        var purl = "?user_point=%7B%0D%0A+%22features%22%3A+%5B%7B%0D%0A++%22geometry%22%3A+%7B%0D%0A+++%22x%22%3A+"+lon.toString()+"%2C%0D%0A+++%22y%22%3A+"+lat.toString()+"%0D%0A++%7D%0D%0A+%7D%5D%0D%0A%7D&env%3AoutSR=&env%3AprocessSR=&returnZ=false&returnM=false&returnTrueCurves=false&f=json";
        return url_dg + purl;
    }

    //This function helps to generate the get url for near tweets data
    function buildTweetsUrl (lon, lat){
        var purl = "?user_point=%7B%0D%0A+features%3A+%5B%7B%0D%0A++geometry%3A+%7B%0D%0A+++x%3A+"+lon.toString()+"%2C%0D%0A+++y%3A+"+lat.toString()+"%0D%0A++%7D%0D%0A+%7D%5D%0D%0A%7D&env%3AoutSR=&env%3AprocessSR=&returnZ=false&returnM=false&returnTrueCurves=false&f=json";
        return url_tweets + purl;
    }

    //This function helps to generate the get url for near road data
    function buildNearRDUrl(lon, lat) {
        var purl = "?user_point=%7B%0D%0A+features%3A+%5B%7B%0D%0A++geometry%3A+%7B%0D%0A+++x%3A+"+lon.toString()+"%2C%0D%0A+++y%3A+"+lat.toString()+"%0D%0A++%7D%0D%0A+%7D%5D%0D%0A%7D&env%3AoutSR=&env%3AprocessSR=&returnZ=false&returnM=false&returnTrueCurves=false&f=json";
        return url_nearRoad + purl;
    }

    //clean the vars
    function cleanGlobeVars() {
        predictFactorReady = 0;
        thislocation_nearRd = 0;
        thislocation_asiaPop = 0;
        thislocation_avgIncome = 0;
        thislocation_tweetsCt = 0;

    }

    function resetPredictUI() {
        $('#asiapop-text').text("?? asian in the census tract");
        $('#avghh-text').text("$ ?? within the census tract");
        $('#distroad-text').text("?? meters to nearest road");
        $('#numtweets-text').text("?? tweets in 100 meter buffer");
        $('#pred-salesvol').text('$ ??????');
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

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}