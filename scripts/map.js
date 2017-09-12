var infoTemplateContent = "<table class='table table-striped'>" +
    "<tr><td colspan='2'><img alt='starbucks' src='img/starbucks-256-long.png' style='width: 280px;' /></td></tr>" +
    "<tr><td>Address:</td><td><span>${Address},${City},${State}&nbsp;${ZIP_Code}</span></td></tr>" +
    "<tr><td>Annual Sales:</td><td><span>&#36;${Location_2:formatContent}</span></td></tr>" +
    "<tr><td>Location Sqt:</td><td><span>${Square_Foo}&nbsp;sqft</span></td></tr>" +
    "<tr><td>Distance to Road:</td><td><span>${Distance:formatContent2Decimal}&nbsp;meters</span></td></tr>" +
    "<tr><td>White Population:</td><td><span>${WHITE_FY:formatContent}</span></td></tr>" +
    "<tr><td>Black Population:</td><td><span>${BLACK_FY:formatContent}</span></td></tr>" +
    "<tr><td>Asian Population:</td><td><span>${ASIAN_CY:formatContent}</span></td></tr></table>";


var dataURL_res = "https://services.arcgis.com/q3Zg9ERurv23iysr/arcgis/rest/services/Starbucks_Location/FeatureServer/0";

require([
    "dojo/number",
    "esri/InfoTemplate",
    "esri/map",
    "esri/layers/FeatureLayer",
    "esri/dijit/HomeButton",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/PictureMarkerSymbol",
    "dojo/domReady!"
], function(number, InfoTemplate, Map, FeatureLayer, HomeButton, SimpleRenderer, PictureMarkerSymbol) {
    // Code to create the map and view will go here
    var map = new Map("viewDiv", {
        basemap: "topo",
        zoom: 13,
        center: [-122.3321, 47.6062],
        minZoom: 13,
        maxZoom: 17
    });
    map.infoWindow.resize(380, 600);
    //setup a home button
    var home = new HomeButton({
        map: map
    }, "HomeButton");
    home.startup();

    //setup the content of the popup box in the map
    formatContent = function (value, key, data) {
        return number.format(value, {places: 0, locale: "en-us"});
    };

    formatContent2Decimal = function (value, key, data) {
        return number.format(value, {places: 2, locale: "en-us"});
    };


    var rTemplate = new InfoTemplate("Starbucks Location", infoTemplateContent);


    var symbol = new PictureMarkerSymbol('img/starbucks-icon.png', 22, 22);
    var featureLayer = new FeatureLayer(dataURL_res,{
        infoTemplate:rTemplate,
        outFields: ["*"]
    });

    var renderer = new SimpleRenderer(symbol);
    featureLayer.setRenderer(renderer);
    map.addLayer(featureLayer);
});

