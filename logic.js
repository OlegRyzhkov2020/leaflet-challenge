// Define a markerSize function that will give each city a different radius based on its population
function markerSize(depth) {
  return (depth+1) * 1000;
}

// Create the tile layer that will be the background of our map
var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "light-v10",
  accessToken: API_KEY
});
// Initialize all of the LayerGroups we'll be using
var layers = {
  EARTHQUAKES: new L.LayerGroup(),
  TECTONIC_PLATES: new L.LayerGroup()
};

// Create the map with our layers
var map = L.map("map-id", {
  center: [39.8097343, -98.5556199],
  zoom: 3,
  layers: [
    layers.EARTHQUAKES,
    layers.TECTONIC_PLATES
  ]
});

// Add our 'lightmap' tile layer to the map
lightmap.addTo(map);

// Create an overlays object to add to the layer control
var overlays = {
  "EARTHQUAKES": layers.EARTHQUAKES,
  "TECTONIC PLATES": layers.TECTONIC_PLATES
};

// Create a control for our layers, add our overlay layers to it
L.control.layers(null, overlays).addTo(map);

// Create a legend to display information about our map
var info = L.control({
  position: "bottomright"
});

// When the layer control is added, insert a div with the class of "legend"
info.onAdd = function() {
  var div = L.DomUtil.create("div", "legend");
  return div;
};
// Add the info legend to the map
info.addTo(map);

// Initialize an object containing icons for each layer group
var icons = {
  EARTHQUAKES: L.ExtraMarkers.icon({
    icon: "ion-settings",
    iconColor: "white",
    markerColor: "yellow",
    shape: "circle"
  }),
  TECTONIC_PLATES: L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: "red",
    shape: "star"
  })
};

// Perform an API call to the Citi Bike Station Information endpoint
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson", function(infoRes) {

  // When the first API call is complete, perform another call to the Citi Bike Station Status endpoint
  //d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_status.json", function(statusRes) {
    var data_features = infoRes.features;
    var lat, lon, location, depth, updatedAt;
    console.log(data_features);
    console.log(data_features[0].properties);
    // Create an object to keep of the number of markers in each layer
    var stationCount = {
      EARTHQUAKES: 0,
      TECTONIC_PLATES: 0
    };
    var stationStatusCode = "EARTHQUAKES";

    for (var i=0; i< data_features.length; i++) {
        // Update the station count
        stationCount[stationStatusCode]++;

        updatedAt = data_features[i].properties.updates;
        lon = data_features[i].geometry.coordinates[0];
        lat = data_features[i].geometry.coordinates[1];
        depth = data_features[i].geometry.coordinates[2];
        location = [lat,lon];

        //console.log(data_features[i].geometry.coordinates);
        console.log(lat, lon, markerSize(depth), location);

        var newCircle = L.circle(location, {
          fillOpacity: 0.75,
          color: "black",
          fillColor: "purple",
          // Setting our circle's radius equal to the output of our markerSize function
          // This will make our marker's size proportionate to its population
          radius: markerSize(depth)
        });

        // Create a new marker with the appropriate icon and coordinates
        var newMarker = L.marker([lat, lon], {
          icon: icons[stationStatusCode]
        });
        // Add the new marker to the appropriate layer
        newCircle.addTo(layers["TECTONIC_PLATES"]);
        newMarker.addTo(layers[stationStatusCode]);

        // Bind a popup to the marker that will  display on click. This will be rendered as HTML
        newMarker.bindPopup(data_features[i].id + "<br> Magnitude: " + data_features[i].properties.mag + "<br>" + "Place:" +data_features[i].properties.place);
        newCircle.bindPopup(data_features[i].id + "<br> Magnitude: " + data_features[i].properties.mag + "<br>" + "Place:" +data_features[i].properties.place);

        // Call the updateLegend function, which will... update the legend!
        updateLegend(updatedAt, stationCount);

      }

});

// Update the legend's innerHTML with the last updated time and station count
function updateLegend(time, stationCount) {
  document.querySelector(".legend").innerHTML = [
    "<p>Updated: " + moment.unix(time).format("h:mm:ss A") + "</p>",
    "<p class='out-of-order'>Number of Earthquakes: " + stationCount.EARTHQUAKES + "</p>",
    "<p class='coming-soon'>Number of Tectonic Plates: " + stationCount.TECTONIC_PLATES + "</p>",
  ].join("");
}
