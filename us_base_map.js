// Main Reference used - Boston Tutorial on Leaflet
// https://maptimeboston.github.io/leaflet-intro/
// along with https://leafletjs.com/examples/choropleth/

// Define the U.S. Mainland Centroid to center the maps on
const Centroid_Lat = 37.00;
const Centroid_Lon = -96.90;
const default_Zoom = 4;

// initialize a null map outside all functions
var map = null;

// Create Base Map by State as soon as page loads
CountyMap(Centroid_Lat, Centroid_Lon, default_Zoom);

// Define Reset button
button = d3.select('.button-container')
  .selectAll('button')
  .data(['Map by State','Map by County'])
  .enter()
    .append('button')
    .attr('class', 'button')
    .text(d => d)
    .on('click', function(d) {

      // update the button class
      d3.selectAll('.button.clicked')
        .classed('clicked', false)
      d3.select(this).classed('clicked', d => d)

      // Choose which Create Map function to call
      if (d == 'Map by State') {
        StateMap(Centroid_Lat, Centroid_Lon, default_Zoom);
      } else {
        CountyMap(Centroid_Lat, Centroid_Lon, default_Zoom);
      }
    });

// Function to Create the Base Map
function StateMap(lat, lon, zoom){

  // Remove any pre-existing Map from the div
  if (map != undefined || map != null) {
    map.off();
    map.remove();
    console.log(map);
  }

  // Reload content of the 'div' where the map is rendered
  document.getElementById('map').innerHTML = "<div id='map' style='width: 100%; height: 100%;'></div>";

  // Using MapBox for open source Tiles (publickey below for Darshan)
  var mapboxAccessToken = 'pk.eyJ1IjoiZGFyc2hhbnN1bWFudCIsImEiOiJjanRka2IzaGYxOGFpNDNwOXQ0MnVrc3F1In0.x2V70JacA-kDg8GjdgmxPw';

  // initialize the map
  map = new L.map('map').setView([Centroid_Lat, Centroid_Lon], default_Zoom);

  // Load tile Layer
  new L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken,
    {
      id: 'mapbox.light',
      attribution: 'Tiles by <a href="https://www.mapbox.com/">mapbox</a>, <a href="https://github.com/python-visualization/folium">Folium</a>, Data by <a href="https://www.consumerfinance.gov/">CFPB</a>'
    }).addTo(map);

  // Add State Polygons
  $.getJSON('https://raw.githubusercontent.com/python-visualization/folium/master/tests/us-states.json', function(statesdata){
    new L.geoJson(statesdata, {style: style}).addTo(map);
  })

}

// Function to Create the Base Map
function CountyMap(lat, lon, zoom){

  // Remove any pre-existing Map from the div
  if (map != undefined || map != null) {
    map.off();
    map.remove();
    console.log(map);
  }

  // Reload content of the 'div' where the map is rendered
  document.getElementById('map').innerHTML = "<div id='map' style='width: 100%; height: 100%;'></div>";

  // Using MapBox for open source Tiles (publickey below for Darshan)
  var mapboxAccessToken = 'pk.eyJ1IjoiZGFyc2hhbnN1bWFudCIsImEiOiJjanRka2IzaGYxOGFpNDNwOXQ0MnVrc3F1In0.x2V70JacA-kDg8GjdgmxPw';

  // initialize the map
  map = new L.map('map').setView([Centroid_Lat, Centroid_Lon], default_Zoom);

  // Load tile Layer
  var baseLayer = new L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken,
    {
      id: 'mapbox.light',
      attribution: 'Tiles by <a href="https://www.mapbox.com/">mapbox</a>, <a href="https://github.com/python-visualization/folium">Folium</a>, Data by <a href="https://www.consumerfinance.gov/">CFPB</a>'
    });
  map.addLayer(baseLayer);

  // Add County Polygons
  $.getJSON('https://raw.githubusercontent.com/python-visualization/folium/master/tests/us-counties.json', function(countiesdata){
    new L.geoJson(countiesdata, {style: style}).addTo(map);
  })

}

// Define colorScale for the State Polygons (Place Holder for now - will be replaced by 2017 Mortgage Volume)
function getColor(d) {
  return d > 1000 ? '#800026' :
         d > 500  ? '#BD0026' :
         d > 200  ? '#E31A1C' :
         d > 100  ? '#FC4E2A' :
         d > 50   ? '#FD8D3C' :
         d > 20   ? '#FEB24C' :
         d > 10   ? '#FED976' :
                    '#FFEDA0';
}

// Define display styles for the State Polygons
function style(feature) {
  return {
      fillColor: getColor(feature.properties.density),
      weight: 0.5,
      opacity: 1,
      color: 'grey',
      dashArray: '3',
      fillOpacity: 0.7,
      class: feature.properties.name
  };
}

// Read in CSV file from CFPB (Total Mortgages originated by State in 2017)
d3.csv("/data/hmda_lar_state_2017.csv").then(function(data) {
  data.forEach(function(d) {
    d.count = +d.count;
    d.as_of_year = +d.as_of_year;
    d.state_name = d.state_name;
  })
  console.log(data[2]);
});
