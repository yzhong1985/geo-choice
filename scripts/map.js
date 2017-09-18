var infoTemplateContent = "<table class='table table-striped'>" +
    "<tr><td colspan='2' class='text-center'><img alt='starbucks' src='img/starbucks-256-long.png' style='width: 240px;' /></td></tr>" +
    "<tr><td colspan='2' class='text-center boldText'><span>${Address},${City},${State}&nbsp;${ZIP_Code}</span></td></tr>" +
    "<tr><td>Annual Sales:</td><td><span>&#36;${Location_2:formatContent}</span></td></tr>" +
    "<tr><td>Location Sqt:</td><td><span>${Square_Foo}&nbsp;sqft</span></td></tr>" +
    "<tr><td>Distance to Road:</td><td><span>${Distance:formatContent2Decimal}&nbsp;meters</span></td></tr>" +
    "<tr><td>Asian Population:</td><td><span>${ASIAN_CY:formatContent}</span></td></tr></table>";

var dataURL_res = "https://services.arcgis.com/q3Zg9ERurv23iysr/arcgis/rest/services/Starbucks_Location/FeatureServer/0";

require([
    "dojo/number",
    "esri/InfoTemplate",
    "esri/map",
    "esri/dijit/HomeButton",
    "esri/layers/FeatureLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/Color",
    "dojo/domReady!"
], function(number, InfoTemplate, Map, HomeButton, FeatureLayer, SimpleRenderer, SimpleMarkerSymbol, Color) {
    // Code to create the map and view will go here
    var map = new Map("viewDiv", {
        basemap: "topo",
        zoom: 15,
        center: [-122.3321, 47.6062],
        minZoom: 13,
        maxZoom: 17
    });
    map.infoWindow.resize(320, 600);
    var home = new HomeButton({
        map: map
    }, "HomeButton");
    home.startup();

    var rTemplate = new InfoTemplate("Starbucks Location", infoTemplateContent);

    var defaultSymbol = new SimpleMarkerSymbol(
        SimpleMarkerSymbol.STYLE_CIRCLE, 10,
        null,
        new Color([82,158,64])
    );

    var featureLayer = new FeatureLayer(dataURL_res,{
        infoTemplate:rTemplate,
        outFields: ["*"]
    });

    var renderer = new SimpleRenderer(defaultSymbol);
    featureLayer.setRenderer(renderer);
    map.addLayer(featureLayer);


    //setup the content of the popup box in the map
    formatContent = function (value, key, data) {
        return number.format(value, {places: 0, locale: "en-us"});
    };
    formatContent2Decimal = function (value, key, data) {
        return number.format(value, {places: 2, locale: "en-us"});
    };

    //debug
    map.on("click", function (e) {
        console.log(e.mapPoint);
    });

});

