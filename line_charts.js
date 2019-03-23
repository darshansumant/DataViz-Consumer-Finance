/*
Name: line_charts.js
Author: Darshan Sumant (cnet: darshansumant)
References: 1) Andrew's TA & d3 workshop materials (especially, the example scaffold)
               https://github.com/mcnuttandrew/capp-30239/
            2) d3 documentation on color scales
            3) d3 + Leaflet Integration example by Mike Bostock
               https://bost.ocks.org/mike/leaflet/
            4) Leaflet Tutorial from Maptime Boston
               https://maptimeboston.github.io/leaflet-intro/
Additional References:
  - Creating Leaflet Chloropleth
    https://leafletjs.com/examples/choropleth/
  - Refreshing Maps on Button click
    https://stackoverflow.com/questions/19186428/refresh-leaflet-map-map-container-is-already-initialized
*/

// Event Listener & JSON fetch structure similar to Andrew's example scaffold
document.addEventListener("DOMContentLoaded", () => {
  // Read in & Plot the performance trends data by state
  fetch('./data/perf_trends_by_state.json')
    .then(response => response.json())
    .then(data => plotTrends(data));

  // Incorporating the County trends creates errors due to '.' in County Names
  // Switching to FIPSCode didn't work due to string to number issues
  // fetch('./data/perf_trends_by_county.json')
  //   .then(response => response.json())
  //   .then(data => plotTrends(data));
});

// Global variables for the line-charts SVG element
const height = 200;
const width = 400;
const margin = {top: 20, left: 30, right: 10, bottom: 30};
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

// Define configurations for the 'g' tags
var trend1 = d3.select('#line-charts').append('g')
    .attr('class', 'trends').attr('id', 'trend1')
    .attr('width', plotWidth).attr('height', plotHeight)
    .attr('transform', "translate(" + 10 + "," + 10 + ")");
var trend2 = d3.select('#line-charts').append('g')
    .attr('class', 'trends').attr('id', 'trend2')
    .attr('width', plotWidth).attr('height', plotHeight)
    .attr('transform', "translate(" + 10 + "," + Number(height+10) + ")");

// Define Tooltip
var tooltip = d3.select('#viz-main').append('div')
  .attr("class", "tooltip-container")
  .attr('transform', "translate(" + Number(950) + "," + Number(25) + ")")
  .append("div")
  .style("opactiy", 0.2)
  .attr("class", "tooltip")
  .attr("id", "tooltip-linecharts");


// Define Data Boxes (Box for Delinquency Line Chart)
var box1 = trend1.append('g')
  .attr('id', 'box1')
  .attr('transform', "translate(" + Number(plotWidth-100) + "," + Number(25) + ")");

box1.append('rect').attr('class', 'box')
  .attr('width', 100).attr('height', 20);

var linelabel1 = box1.append('text')
  .attr('class', 'chartdatalabel').attr('id', 'label1')
  .attr('transform', "translate(" + Number(10) + "," + Number(0) + ")")
  .attr("dy", "1.1em").attr('font-size', 12);

// Define Data Boxes (Box for NPA Line Chart)
var box2 = trend2.append('g')
  .attr('id', 'box2')
  .attr('transform', "translate(" + Number(plotWidth-100) + "," + Number(25) + ")");

box2.append('rect').attr('class', 'box')
  .attr('width', 100).attr('height', 20);

var linelabel2 = box2.append('text')
  .attr('class', 'chartdatalabel').attr('id', 'label2')
  .attr('transform', "translate(" + Number(10) + "," + Number(0) + ")")
  .attr("dy", "1.1em").attr('font-size', 12);

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

// Extract Time Domain from the JSON
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

// Function to create plot Axes
function buildAnnotations(g, x, y, plotHeight, xTitle, yTitle) {

  // Build X-Axis
  g.append('g').call(d3.axisBottom(x)).attr('transform', `translate(0, ${plotHeight})`);
  g.append('text').attr('transform', `translate(${plotWidth/2}, ${plotHeight+35})`)
    .text(xTitle).attr('font-size', 12);

  // Build Y-Axis
  g.append('g').call(d3.axisLeft(y)).attr('transform', `translate(${margin.left},0)`);
  g.append('text').attr('transform', `rotate(-90)`)
    .attr("y", 0 - 10)
    .attr("x", 0 - (plotHeight*0.65))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text(yTitle).attr('font-size', 12);

  const timeFormatter = d3.timeFormat('%Y-%m-%d');

}

// Function to create plot Title
function buildTitle(g, width, margin, title_text){
  g.append("text")
    .attr("class", "title")
    .attr("x", 0.5*width)
    .attr("y", 0.5*margin.top)
    .text(title_text)
    .attr("text-anchor", "middle")
    .attr("font-size", 14)
    .attr("font-family", "sans-serif")
    .attr("fill", "black");
}

// Generic Function to plot line-charts
function plotTrends(data) {

  // GroupBy 'Name' to create separate series for each State
  const groups = groupBy(data, 'Name');
  const mappedData = Object.keys(groups).map(key => ({key, data: groups[key]}));

  // Get full domain of the Axes
  const timeDomain = getTimeDomain(data);
  const yDomain = getYDomain(data, 'npa');

  // Define the the X-axis scaling (time scale)
  const x = d3.scaleTime()
    .domain([new Date(timeDomain.min), new Date(timeDomain.max)])
    .range([margin.left, plotWidth]);

    // Define the Y-Axis scaling (start from 0 to avoid misinterpretation)
    const y = d3.scaleLinear()
      // .domain([0, yDomain.max])
      .domain([0, 12]) // Max across del & npa (state & county)
      .range([plotHeight, margin.top]);

    // Define Color scale (by Group) - all series in grey (none in focus)
    const color = d3.scaleOrdinal().domain(Object.keys(groups))
      .range(['#D3D3D3']);

    // Define the line creation function - trying different variables
    const lineEval_del = d3.line().x(d => x(new Date(d.date))).y(d => y(Number(d.del)));
    const lineEval_npa = d3.line().x(d => x(new Date(d.date))).y(d => y(Number(d.npa)));

    // create the line charts (delinquency & npa)
    trend1.selectAll('line').data(mappedData)
      .enter().append('path')
      .attr('d', d => lineEval_del(d.data))
      .attr('stroke', d => color(d.key))
      .attr('fill', 'none')
      .attr('stroke-width', 0.5)
      // .attr("class", function(d,i) { return d['FIPSCode']; })
      .attr("class", function(d,i) { return d.key; })
      .on("mouseover", function(d, i) {
        console.log(d.key)
        d3.selectAll("path." + d.key)
          .attr("fill", "lightyellow")
          .attr("stroke", "black")
          .attr("stroke-width", 3)
        // Update the data box label
        d3.selectAll('.chartdatalabel').text(d.key)
      })
      .on("mouseout", function(d, i) {
        d3.selectAll("path." + d.key)
          .attr("fill", "none")
          .attr("stroke", "grey")
          .attr("stroke-width", 0.5)
        // Update the data box label
        d3.selectAll('.chartdatalabel').text('')
      });

    trend2.selectAll('line').data(mappedData)
      .enter().append('path')
      .attr('d', d => lineEval_npa(d.data))
      .attr('stroke', d => color(d.key))
      .attr('fill', 'none')
      .attr('stroke-width', 0.5)
      .attr("class", function(d,i) { return d.key; })
      .on("mouseover", function(d, i) {
        console.log(d.key)
        d3.selectAll("path." + d.key)
          .attr("fill", "lightyellow")
          .attr("stroke", "black")
          .attr("stroke-width", 3)
        // Update the data box label
        d3.selectAll('.chartdatalabel').text(d.key)

        // Make Tooltip visible
        tooltip.html(`Hello ${d.key}`)
          .style("opacity", 0.85)
          // .style("left", `${d3.mouse(this)[0] + 15}px`)
          // .style("top", `${d3.mouse(this)[1] + 15}px`)
          .style("left", d3.select(this).attr("x") + "px")
          .style("top", d3.select(this).attr("y") + "px");
      })
      .on("mouseout", function(d, i) {
        d3.selectAll("path." + d.key)
          .attr("fill", "none")
          .attr("stroke", "grey")
          .attr("stroke-width", 0.5)
        // Update the data box label
        d3.selectAll('.chartdatalabel').text('')

        tooltip
          .style("opacity", 0.2);
      })
      .on("mousmove", function(d, i){
        // var xPos = d3.mouse(this)[0] - 15;
        // var yPos = d3.mouse(this)[1] - 25;
        // tooltip.attr("transform", "translate(" + xPos + "," + yPos + ")");
        // tooltip.select("text").text(d.key);
      });

    // add titles & axes to the trend charts
    buildAnnotations(trend1, x, y, plotHeight, 'Year', 'Delinquency Rate (%)');
    buildTitle(trend1, plotWidth, margin, "Delinquencies have declined slowly despite seasonal highs")
    // add titles & axes to the trend charts
    buildAnnotations(trend2, x, y, plotHeight, 'Year', 'NPA Rate (%)');
    buildTitle(trend2, plotWidth, margin, "Mortgage NPA rates have declined after initial rise post 2008")

}
