// Referenced from Mike Bostock's D3+Leaflet integration
// https://bost.ocks.org/mike/leaflet/

// Adjust Zoom & Map Center to fit the mainland U.S. in the svg window
var map = new L.Map("map", {center: [37.0, -96.9], zoom: 4})
    .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

d3.json("https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json", function(error, collection) {
  if (error) throw error;

  var transform = d3.geo.transform({point: projectPoint}),
      path = d3.geo.path().projection(transform);

  var feature = g.selectAll("path")
    .data(collection.features)
    .enter().append("path")
    .attr("pointer-events", "visible");

  map.on("viewreset", reset);
  reset();

  function reset(){

    var bounds = path.bounds(collection),
        topLeft = bounds[0],
        bottomRight = bounds[1];

    svg.attr("width", bottomRight[0] - topLeft[0])
      .attr("height", bottomRight[1] - topLeft[1])
      .style("left", topLeft[0] + "px")
      .style("top", topLeft[1] + "px");

    g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

    feature.attr("d", path);
  }

  function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }

});
