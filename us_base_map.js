// Main Reference used - Boston Tutorial on Leaflet
// https://maptimeboston.github.io/leaflet-intro/
// along with https://leafletjs.com/examples/choropleth/

// Using MapBox for open source Tiles (publickey below for Darshan)
var mapboxAccessToken = 'pk.eyJ1IjoiZGFyc2hhbnN1bWFudCIsImEiOiJjanRka2IzaGYxOGFpNDNwOXQ0MnVrc3F1In0.x2V70JacA-kDg8GjdgmxPw';

// initialize the map
var map = L.map('map').setView([37.0, -96.90], 4);

// Load tile Layer
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken,
  {
    id: 'mapbox.light',
    attribution: 'Tiles by <a href="https://www.mapbox.com/">mapbox</a>, <a href="https://github.com/PublicaMundi">PublicaMundi</a>, Data by <a href="https://www.consumerfinance.gov/">CFPB</a>'
  }).addTo(map);

// Add State Polygons
$.getJSON('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json', function(statesdata){
  L.geoJson(statesdata, {style: style}).addTo(map);
})

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
      weight: 2,
      opacity: 1,
      color: 'white',
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
