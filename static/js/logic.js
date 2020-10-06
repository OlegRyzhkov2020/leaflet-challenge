// Define a markerSize function that will give each city a different radius based on its population
function markerSize(mag) {
  return Math.log(Math.max(mag,0)+1)*40000;
}
// Function that will determine the color of a neighborhood based on the borough it belongs to
function chooseColor(depth) {
  var color_value;
  if (depth > 20) {
    color_value = "darkred"
  }
  else if (depth <= 20 && depth > 8) {
    color_value = "yellow"
  }
  else if (depth < 4) {
    color_value = "green"
  }
  return color_value;
}
// Create the tile layer that will be the background of our map
var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "streets-v11", //"light-v10",
  accessToken: API_KEY
});
var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "light-v10",
  accessToken: API_KEY
});
var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "satellite-v9",
  accessToken: API_KEY
});
// Initialize all of the LayerGroups we'll be using
var layers = {
  EARTHQUAKES_CIRCLE: new L.LayerGroup(),
  EARTHQUAKES_MARKERS: new L.LayerGroup(),
  TECTONIC_PLATES: new L.LayerGroup()
};

// Create the map with our layers
var map = L.map("map-id", {
  center: [39.8097343, -98.5556199],
  zoom: 3,
  layers: [
    layers.EARTHQUAKES_CIRCLE
  ]
});

// Create an overlays object to add to the layer control
var overlays = {
  "EARTHQUAKES CIRCLES": layers.EARTHQUAKES_CIRCLE,
  "EARTHQUAKES_MARKERS": layers.EARTHQUAKES_MARKERS,
  "TECTONIC PLATES": layers.TECTONIC_PLATES
};

// Add our 'lightmap' tile layer to the map
lightmap.addTo(layers["EARTHQUAKES_MARKERS"]);

// Add our 'lightmap' tile layer to the map
streetmap.addTo(layers["EARTHQUAKES_CIRCLE"]);

// Add our 'lightmap' tile layer to the map
darkmap.addTo(layers["TECTONIC_PLATES"]);

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
  EARTHQUAKES_MARKERS: L.ExtraMarkers.icon({
    icon: "ion-settings",
    iconColor: "white",
    markerColor: "darkred",
    shape: "circle"
  })
};

// Use this link to get the geojson data.
var link = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";

// Perform an API call to the Earthquakes Information endpoint
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson", function(infoRes) {

  // Grabbing our GeoJSON data..
  d3.json(link, function(data) {
    // Creating a geoJSON layer with the retrieved data
    var tectPlates = L.geoJson(data, {}).addTo(layers["TECTONIC_PLATES"]);

    var data_features = infoRes.features;
    var lat, lon, location, depth, magnitude, updatedAt;
    var depth_array = [];
    console.log(data_features);
    console.log(data_features[0].properties);
    // Create an object to keep of the number of markers in each layer
    var quakesCount = {
      EARTHQUAKES_CIRCLE: 0,
      EARTHQUAKES_MARKERS: 0,
      TECTONIC_PLATES: 0
    };

    for (var i=0; i< data_features.length; i++) {
        // Update the station count
        quakesCount["EARTHQUAKES_CIRCLE"]++;

        updatedAt = data_features[i].properties.updated;
        lon = data_features[i].geometry.coordinates[0];
        lat = data_features[i].geometry.coordinates[1];
        depth = data_features[i].geometry.coordinates[2];
        magnitude = data_features[i].properties.mag;
        location = [lat,lon];
        depth_array[depth_array.length] = depth;
        //console.log(magnitude, depth, chooseColor(depth));

        var newCircle = L.circle(location, {
          fillOpacity: 0.75,
          color: chooseColor(depth),
          fillColor: chooseColor(depth),
          // Setting our circle's radius equal to the output of our markerSize function
          // This will make our marker's size proportionate to its population
          radius: markerSize(magnitude)
        });

        // Create a new marker with the appropriate icon and coordinates
        var newMarker = L.marker([lat, lon], {
          icon: icons["EARTHQUAKES_MARKERS"]
        });
        // Add the new marker to the appropriate layer
        newCircle.addTo(layers["EARTHQUAKES_CIRCLE"]);
        newMarker.addTo(layers["EARTHQUAKES_MARKERS"]);
        newCircle.addTo(layers["TECTONIC_PLATES"]);

        // Bind a popup to the marker that will  display on click. This will be rendered as HTML
        newMarker.bindPopup("Earthquake record ID:" + data_features[i].id + "<br> Magnitude: " + magnitude + "<br>" + "Place:" +data_features[i].properties.place);
        newCircle.bindPopup("Earthquake record ID:" + data_features[i].id + "<br> Magnitude: " + magnitude + "<br>" + "Place:" +data_features[i].properties.place);
        tectPlates.bindPopup("Earthquake record ID:" + data_features[i].id + "<br> Magnitude: " + magnitude + "<br>" + "Place:" +data_features[i].properties.place);
        // Call the updateLegend function, which will... update the legend!
        updateLegend(updatedAt, quakesCount);

      }
  })
});


// Update the legend's innerHTML with the last updated time and station count
function updateLegend(time, quakesCount) {
  document.querySelector(".legend").innerHTML = [
    "<p>Last Update: " + moment.unix(time).format("h:mm:ss A") + "</p>",
    "<p class='out-of-order'>Last Week Number of Earthquakes: " + quakesCount.EARTHQUAKES_CIRCLE + "</p>"
  ].join("");
}
