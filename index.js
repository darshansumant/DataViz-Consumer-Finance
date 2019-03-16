/*
Name: index.js
Author: Darshan Sumant (cnet: darshansumant)
References: 1) Andrew's TA & d3 workshop materials
               https://github.com/mcnuttandrew/capp-30239/
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
    });
  fetch('./data/perf_trends_by_state.json')
  // Read in the Performance Trends data by State
    .then(response => response.json())
    .then(data => stockVis(data));
});

// Reference: http://bl.ocks.org/mattykuch/40ba19de703632ea2afbbc5156b9471f
var activeDistrict; // Will be used for linked hovering


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
  const height = 2000;
  const margin = {top: 10, left: 10, right: 10, bottom: 10 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

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
      .attr('width', 500)
      .attr('height', 400)
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('class', 'map_del');

  // construct the rendered states
  chart1.selectAll('.state')
    .data(stateShapes.features)
    .enter()
    .append('path')
      .attr('class', d => d.properties.State)
      .attr('stroke', 'black')
      .attr('fill', d => colorScale(stateNameToDel[d.properties.State]))
      .attr('d', d => geoGenerator(d));

  const chart2 = d3.select('.vis-container')
    .append('g')
      .attr('transform', "translate(" + margin.left + "," + 600 + ")")
      .attr('class', 'map_npa');

  // construct the rendered states
  chart2.selectAll('.state')
    .data(stateShapes.features)
    .enter()
    .append('path')
      .attr('class', d => d.properties.State)
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

// Extract different Data Series from JSON using GroupBy function
function groupBy(data, accesor) {
  return data.reduce((acc, row) => {
    if (!acc[row[accesor]]) {
      acc[row[accesor]] = [];
    }
    acc[row[accesor]].push(row);
    return acc;
  }, {});
}
// This function addresses the often fidly problem of date manipulation
// minVal and maxVal are in epoch time, while min and max are the regular domain
// as strings. You should use min and max for the domain.
function getTimeDomain(data) {
  return data.reduce((acc, row) => {
    const epochTime = (new Date(row.date)).getTime();
    return {
      minVal: Math.min(epochTime, acc.minVal),
      maxVal: Math.max(epochTime, acc.maxVal),
      min: epochTime < acc.minVal ? row.date : acc.min,
      max: epochTime > acc.maxVal ? row.date : acc.max
    };
  }, {minVal: Infinity, maxVal: -Infinity, min: null, max: null});
}

// Function to get the Y-axis domain/range
function getYDomain(data, accessor) {
  return data.reduce((acc, row) => {
    const val = Number(row[accessor]);
    return {
      min: Math.min(val, acc.min),
      max: Math.max(val, acc.max)
    };
  }, {min: Infinity, max: -Infinity});
}

function stockVis(data) {

  // first break apart the data into one series for each of the companies
  const height = 400;
  const width = 500;
  const margin = {top: 10, left: 20, right: 10, bottom: 10};
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // GroupBy 'Name' to create separate series for each State
  const groups = groupBy(data, 'Name');
  const mappedData = Object.keys(groups).map(key => ({key, data: groups[key]}));

  const timeDomain = getTimeDomain(data);
  const yDomain = getYDomain(data, 'npa');

  // Define the the X-axis scaling (time scale)
  const x = d3.scaleTime()
    .domain([new Date(timeDomain.min), new Date(timeDomain.max)])
    .range([margin.left, plotWidth]);

  // Define the Y-Axis scaling
  const y = d3.scaleLinear()
    // .domain([yDomain.min, yDomain.max])
    .domain([0, yDomain.max])
    .range([plotHeight, margin.top]);

  // Define Color scale (by Group) - all series in grey (none in focus)
  const color = d3.scaleOrdinal().domain(Object.keys(groups))
    .range(['#D3D3D3']);

  // Define the line creation function - trying different variables
  const lineEval_del = d3.line().x(d => x(new Date(d.date))).y(d => y(Number(d.del)));
  const lineEval_npa = d3.line().x(d => x(new Date(d.date))).y(d => y(Number(d.npa)));
  // const svg = d3.select('#thevis').attr('width', width).attr('height', height);

  // Line plots to show Delinquency Trends (separate series for each state)
  const chart3 = d3.select('.vis-container')
    .append('g')
      .attr('transform', "translate(" + margin.left + "," + 1200 + ")")
      .attr('class', 'trends_del')
      .attr('height', height)
      .attr('width', width);

  chart3.selectAll('line').data(mappedData)
    .enter().append('path')
    .attr('d', d => lineEval_del(d.data))
    .attr('stroke', d => color(d.key))
    .attr('fill', 'none')
    .attr('stroke-width', 2);

  buildAnnotations(chart3, x, y, plotHeight);
  buildTitle(chart3, width, margin, "Month-on-Month Mortgage Delinquency rates")

  // Line plots to show NPA Trends (separate series for each state)
  const chart4 = d3.select('.vis-container')
    .append('g')
      .attr('transform', "translate(" + Number(margin.left + 550) + "," + 1200 + ")")
      .attr('class', 'trends_npa')
      .attr('height', height)
      .attr('width', width);

  chart4.selectAll('line').data(mappedData)
    .enter().append('path')
    .attr('d', d => lineEval_npa(d.data))
    .attr('stroke', d => color(d.key))
    .attr('fill', 'none')
    .attr('stroke-width', 2);

  buildAnnotations(chart4, x, y, plotHeight);
  buildTitle(chart4, width, margin, "Month-on-Month Mortgage NPA rates")

  // buildLegend(svg, color, Object.keys(groups), plotHeight, plotWidth);
}

function buildAnnotations(g, x, y, plotHeight) {
  g.append('g').call(d3.axisBottom(x)).attr('transform', `translate(0, ${plotHeight})`);
  g.append('g').call(d3.axisLeft(y));

  const timeFormatter = d3.timeFormat('%Y-%m-%d');

}

function buildTitle(g, width, margin, title_text){
  g.append("text")
    .attr("class", "title")
    .attr("x", 0.5*width)
    .attr("y", 0.5*margin.top)
    .text(title_text)
    .attr("text-anchor", "middle")
    .attr("font-size", 14)
    .attr("font-family", "sans-serif")
    .attr("fill", "navy");
}
