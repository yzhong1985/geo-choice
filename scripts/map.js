require([
    "esri/map",
    "esri/layers/FeatureLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/PictureMarkerSymbol",
    "dojo/domReady!"
], function(Map, FeatureLayer, SimpleRenderer, PictureMarkerSymbol) {
    // Code to create the map and view will go here
    var map = new Map("viewDiv", {
        basemap: "topo",
        zoom: 13,
        center: [-122.3321, 47.6062],
        minZoom: 13,
        maxZoom: 17
    });

    var symbol = new PictureMarkerSymbol('img/starbucks-icon.png', 20, 20);
    var featureLayer = new FeatureLayer("https://services.arcgis.com/q3Zg9ERurv23iysr/arcgis/rest/services/Starbucks_Location/FeatureServer/0");

    var renderer = new SimpleRenderer(symbol);
    featureLayer.setRenderer(renderer);
    map.addLayer(featureLayer);
});

