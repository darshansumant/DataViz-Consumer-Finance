/*
Name: index.js
Author: Darshan Sumant (cnet: darshansumant)
Reference: 1) Andrew's TA & d3 workshop materials
           2) d3 documentation on color scales
           3) geoplot repository - https://github.com/ResidentMario/geoplot-data
*/

document.addEventListener("DOMContentLoaded", () => {
  // Promise structure same as example_scaffold shared by Andrew
  Promise.all([
    'https://raw.githubusercontent.com/ResidentMario/geoplot-data/master/contiguous-usa.geojson'
    ,'./data/yoy_del_rates_state.json'
    ,'./data/yoy_npa_rates_state.json'
  ].map(url => fetch(url)
    // convert to JSON & send to Chloropleth function
    .then(data => data.json())))
    .then(data => myVis(data))
    // Error handling - push log to console
    .catch(function(error) {
      console.log(error);
    })
});

// function to extract domain from data provided
function computeDomain(data, key) {
  return data.reduce((acc, row) => {
    return {
      min: Math.min(acc.min, row[key]),
      max: Math.max(acc.max, row[key])
    };
  }, {min: Infinity, max: -Infinity});
}

// Using the function structure similar to that provided by Andrew
function myVis(data) {

  const [stateShapes, stateDel, stateNPA] = data;
  const width = 1000;
  const height = 1100;
  const margin = {
    top: 10,
    left: 10,
    right: 10,
    bottom: 10
  };

  // color defined as per delinquency domain
  const delDomain = computeDomain(stateDel, 'mean_del');

  // Delinquency Rates by State
  const stateNameToDel = stateDel.reduce((acc, row) => {
    acc[row.Name] = row.mean_del;
    return acc;
  }, {});

  // NPA Rates by State
  const stateNameToNPA = stateNPA.reduce((acc, row) => {
    acc[row.Name] = row.mean_npa;
    return acc;
  }, {});

  // Color Scales
  // using same scale for Delinquency & NPA rates on purpose for easy comparison
  const delScale = d3.scaleLinear().domain([0, delDomain.max]).range([0, 1]);
  const colorScale = d => d3.interpolateViridis(delScale(d));  // linear interploation, not using sqrt

  // Projection (same as workshop exercise)
  const projection = d3.geoAlbersUsa();
  const geoGenerator = d3.geoPath(projection);
  // container for the visualization
  const chart1 = d3.select('.vis-container')
    .attr('width', width)
    .attr('height', height)
    .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('class', 'delinquency');

  // construct the rendered states
  chart1.selectAll('.state')
    .data(stateShapes.features)
    .enter()
    .append('path')
      .attr('class', 'state')
      .attr('stroke', 'black')
      .attr('fill', d => colorScale(stateNameToDel[d.properties.State]))
      .attr('d', d => geoGenerator(d));

  const chart2 = d3.select('.vis-container')
    .append('g')
      .attr('transform', "translate(" + margin.left + "," + 560 + ")")
      .attr('class', 'npa');

  // construct the rendered states
  chart2.selectAll('.state')
    .data(stateShapes.features)
    .enter()
    .append('path')
      .attr('class', 'state')
      .attr('stroke', 'black')
      .attr('fill', d => colorScale(stateNameToNPA[d.properties.State]))
        .attr('d', d => geoGenerator(d));

  // Graph Title (Chart 1)
  const title1 = chart1.append("text")
    .attr("class", "title1")
    .attr("x", 0.5*width)
    .attr("y", 0.5*margin.top)
    .text("Mortgage Delinquency (30-90 days overdue) by State (2017)")
    .attr("text-anchor", "middle")
    .attr("font-size", 20)
    .attr("font-family", "sans-serif")
    .attr("fill", "navy");

  // Graph Title (Chart 2)
  const title2 = chart2.append("text")
    .attr("class", "title1")
    .attr("x", 0.5*width)
    .attr("y", 0.5*margin.top)
    .text("Mortgage NPA (90+ days overdue) by State (2017)")
    .attr("text-anchor", "middle")
    .attr("font-size", 20)
    .attr("font-family", "sans-serif")
    .attr("fill", "navy");

}
