var infoTemplateContent = "<table class='table table-striped'>" +
    "<tr><td colspan='2' class='text-center'><img alt='starbucks' src='img/starbucks-256-long.png' style='width: 240px;' /></td></tr>" +
    "<tr><td colspan='2' class='text-center boldText'><span>${Address},${City},${State}&nbsp;${ZIP_Code}</span></td></tr>" +
    "<tr><td>Annual Sales:</td><td><span>&#36;${Location_2:formatContent}</span></td></tr>" +
    "<tr><td>Location Sqt:</td><td><span>${Square_Foo}&nbsp;sqft</span></td></tr>" +
    "<tr><td>Number of Tweets:</td><td><span>${Count_}</span></td></tr>" +
    "<tr><td>Distance to Road:</td><td><span>${Distance:formatContent2Decimal}&nbsp;meters</span></td></tr>" +
    "<tr><td>Asian Population:</td><td><span>${ASIAN_CY:formatContent}</span></td></tr></table>";

var dataURL_res = "https://services.arcgis.com/q3Zg9ERurv23iysr/arcgis/rest/services/Starbucks_Location/FeatureServer/0";
var demographicURL_res = "https://services.arcgis.com/q3Zg9ERurv23iysr/arcgis/rest/services/Seattle_Final_Demographic/FeatureServer/0";

var raceField = {
    asian: "Asian_Pct",
    black: "Black_Pct",
    hispanic: "Hisp_Pct",
    income: "Med_Income",
    white: "White_Pct",
};

var raceLegendText = {
    asian: "Asian %",
    black: "Black %",
    hispanic: "Hispanic %",
    income: "Median Income($)",
    white: "White %"
};

var raceRepColor = {
    black: "#000000",
    asian: "#CD3B00",
    hispanic: "#f400d7",
    income: "#03B300",
    white: "#0054f4",

};

var raceValueBreak = {
    whiteMax: 100,
    whiteMin: 20,
    asianMax: 60,
    asianMin: 0,
    hispanicMax: 50,
    hispanicMin: 0,
    blackMax: 25,
    blackMin: 0,
    incomeMax: 200000,
    incomeMin: 30000,
};


var app={};

require([
    "dojo/on", "dojo/number",
    "esri/InfoTemplate",
    "esri/map",
    "esri/tasks/query",
    "esri/dijit/Legend",
    "esri/layers/FeatureLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/Color",
    "dojo/domReady!"
], function(on, number, InfoTemplate, Map, Query, Legend, FeatureLayer, SimpleRenderer, SimpleFillSymbol, SimpleLineSymbol, PictureMarkerSymbol, SimpleMarkerSymbol, Color) {
    // Code to create the map and view will go here
    app.map = new Map("viewDiv", {
        basemap: "topo",
        zoom: 15,
        center: [-122.3321, 47.6062],
        minZoom: 13,
        maxZoom: 17
    });

    app.map.infoWindow.resize(320, 600);
    var rTemplate = new InfoTemplate("Starbucks Location", infoTemplateContent);
    app.defaultSymbol = new PictureMarkerSymbol('img/starbucks-icon.png', 22, 22);
    app.symbolSelection = new PictureMarkerSymbol('img/starbucks-icon.png', 22, 22);
    // var defaultSymbol = new SimpleMarkerSymbol(
    //     SimpleMarkerSymbol.STYLE_CIRCLE, 10,
    //     null,
    //     new Color([82,158,64])
    // );

    app.featureLayer = new FeatureLayer(dataURL_res,{
        infoTemplate:rTemplate,
        outFields: ["*"]
    });

    var renderer = new SimpleRenderer(app.defaultSymbol);
    app.featureLayer.setRenderer(renderer);
    app.featureLayer.setSelectionSymbol(app.symbolSelection);
    app.map.addLayer(app.featureLayer);

    app.query = new Query();

    on(app.map, "load", function () {
        $(document).ready(function () {
            //bind events
            stringHelper();
            $("#basemapsel").change(basemapChange);
            $("#salesvolsel").change(selectionChange);
            $("#sizesel").change(selectionChange);
            $("#tweetsel").change(selectionChange);
            $("#asianpopsel").change(selectionChange);
            $("#raceGroupsel").change(raceGroupChange);
        });
    });
    app.isLegendStart = false;
    app.dataURL_race = demographicURL_res;
    app.raceLayer = new FeatureLayer(app.dataURL_race);
    app.raceLayer.setOpacity(0.6);
    app.raceRenderer = new SimpleRenderer(new SimpleFillSymbol().setOutline(new SimpleLineSymbol().setWidth(0.3).setColor(new Color([128, 128, 128]))));
    app.raceLegend = new Legend({
        autoUpdate: false,
        map: app.map,
        layerInfos: [{title: "Percentage of Population", layer: app.raceLayer}]
    }, "legend");

    //setup the content of the popup box in the map
    formatContent = function (value, key, data) {
        return number.format(value, {places: 0, locale: "en-us"});
    };
    formatContent2Decimal = function (value, key, data) {
        return number.format(value, {places: 2, locale: "en-us"});
    };


    function selectionChange(e){
        var r = e.target.selectedOptions[0];
        var nullSymbol = new SimpleMarkerSymbol().setSize(0);
        app.featureLayer.setRenderer(new SimpleRenderer(nullSymbol));
        app.featureLayer.refresh();

        app.query.where = queryBuilder(r.value);
        app.featureLayer.selectFeatures(app.query, FeatureLayer.SELECTION_NEW, selectFeatures, errorHandler);
    }

    function queryBuilder(v) {
        var w = "Location_2 >= {0} AND Location_2 <{1} AND Square_Foo = {2} AND Count_ >={3} AND Count_ <{4} AND ASIAN_CY >={5} AND ASIAN_CY <{6}";
        //get all the selection value
        var salesv = $("#salesvolsel option:selected").val();
        var locationv = $("#sizesel option:selected").val();
        var tweetsv = $("#tweetsel option:selected").val();
        var asianv = $("#asianpopsel option:selected").val();

        var salmax = 50000000;
        var salmin = 0;
        var locsize = "Square_Foo";
        var tweetmax = 40000;
        var tweetmin = 0;
        var asiamax = 20000;
        var asiamin = 0;

        if(salesv == 'v0'){
            salmax = 50000000;
            salmin = 0;
        }
        else if(salesv == 'v1'){
            salmax = 200000;
        }
        else if(salesv == 'v2'){
            salmax = 700000;
            salmin = 200000;
        }
        else if(salesv == 'v3'){
            salmax = 1200000;
            salmin = 700000;
        }
        else if(salesv == 'v4'){
            salmax = 2000000;
            salmin = 1200000;
        }
        else if(salesv == 'v5'){
            salmax = 5000000;
            salmin = 2000000;
        }

        if(locationv == 's0'){
            locsize = "Square_Foo";
        }
        else if(locationv == 's1'){
            locsize = "'1,500 - 2,499'";
        }
        else if(locationv == 's2'){
            locsize = "'2,500 - 4,999'";
        }

        if(tweetsv == 't0'){
            tweetmax = 40000;
            tweetmin = 0;
        }
        else if(tweetsv == 't1'){
            tweetmax = 1000;
            tweetmin = 0;
        }
        else if(tweetsv == 't2'){
            tweetmax = 4000;
            tweetmin = 1000;
        }
        else if(tweetsv == 't3'){
            tweetmax = 14000;
            tweetmin = 4000;
        }
        else if(tweetsv == 't4'){
            tweetmax = 40000;
            tweetmin = 14000;
        }

        if(asianv == 'a0'){
            asiamax = 20000;
            asiamin = 0;
        }
        else if(asianv == 'a1'){
            asiamax = 2500;
            asiamin = 0;
        }
        else if(asianv == 'a2'){
            asiamax = 5000;
            asiamin = 2501;
        }
        else if(asianv == 'a3'){
            asiamax = 10000;
            asiamin = 5001;
        }
        else if(asianv == 'a4'){
            asiamax = 20000;
            asiamin = 10000;
        }

        w = String.format(w,salmin.toString(), salmax.toString(),locsize, tweetmin.toString(), tweetmax.toString(), asiamin.toString(), asiamax.toString());
        //console.log(w);
        //var a = String.format('{0} is dead, but {1} is alive! {0} {2}', 'ASP', 'ASP.NET');

        return w;
    }    
    
    function selectFeatures(r) {
        //console.log(r);
    }

    function errorHandler(err) {
        console.log("error: ", JSON.stringify(err));
    }

    function basemapChange(e) {
        var r = e.target.selectedOptions[0];
        app.map.setBasemap(r.value);
    }

    function stringHelper(){
        // First, checks if it isn't implemented yet.
        if (!String.format) {
            String.format = function(format) {
                var args = Array.prototype.slice.call(arguments, 1);
                return format.replace(/{(\d+)}/g, function(match, number) {
                    return typeof args[number] != 'undefined'
                        ? args[number]
                        : match
                        ;
                });
            };
        }
    }

    function raceGroupChange(e) {

        var r = e.target.selectedOptions[0];
        app.race = r.value;

        var race = app.race;

        var field, minV, maxV, colorHex, legendTxt;
        $('#info').show();
        if (race == "white") {
            field = raceField.white;
            minV = raceValueBreak.whiteMin;
            maxV = raceValueBreak.whiteMax;
            colorHex = raceRepColor.white;
            legendTxt = raceLegendText.white;
        }
        else if (race == "asian") {
            field = raceField.asian;
            minV = raceValueBreak.asianMin;
            maxV = raceValueBreak.asianMax;
            colorHex = raceRepColor.asian;
            legendTxt = raceLegendText.asian;
        }
        else if (race == "black") {
            field = raceField.black;
            minV = raceValueBreak.blackMin;
            maxV = raceValueBreak.blackMax;
            colorHex = raceRepColor.black;
            legendTxt = raceLegendText.black;
        }
        else if (race == "hispanic") {
            field = raceField.hispanic;
            minV = raceValueBreak.hispanicMin;
            maxV = raceValueBreak.hispanicMax;
            colorHex = raceRepColor.hispanic;
            legendTxt = raceLegendText.hispanic;
        }
        else if (race == "income") {
            field = raceField.income;
            minV = raceValueBreak.incomeMin;
            maxV = raceValueBreak.incomeMax;
            colorHex = raceRepColor.income;
            legendTxt = raceLegendText.income;
        }
        else {
            if(app.isLegendStart) {
                $('#info').hide();
            }
            app.map.removeLayer(app.raceLayer);
            return;
        }

        app.raceRenderer.setColorInfo({
            field: field,
            minDataValue: minV,
            maxDataValue: maxV,
            colors: [
                new Color("#FFFFFF"),
                new Color(colorHex)
            ]
        });

        // Reset layer by removing it and adding it back
        app.raceLayer.setRenderer(app.raceRenderer);
        app.map.removeLayer(app.raceLayer);
        app.map.addLayer(app.raceLayer, 0);

        if(!app.isLegendStart){
            app.raceLegend.startup();
            app.isLegendStart= true;
        }
        else
        {
            app.raceLegend.refresh();
        }

        //update legend text
        updateLegendText(legendTxt);

    }

    function updateLegendText(legendTxt) {
        $("table.esriLegendLayer td table td").text(legendTxt);
    }




});

