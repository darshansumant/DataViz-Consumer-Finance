document.addEventListener("DOMContentLoaded", () => {
  // Read in & Plot the performance trends data by state
  fetch('./data/perf_trends_by_state.json')
    .then(response => response.json())
    .then(data => plotTrends(data));
});

// Global variables for the line-charts SVG element
const height = 200;
const width = 400;
const margin = {top: 20, left: 20, right: 20, bottom: 20};
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

// Define configurations for the 'g' tags
var trend1 = d3.select('#line-charts').append('g')
    .attr('class', 'trends').attr('id', 'trend1')
    .attr('width', plotWidth).attr('height', plotHeight)
    .attr('transform', "translate(" + 10 + "," + 10 + ")");
var trend2 = d3.select('#line-charts').append('g')
    .attr('class', 'trends').attr('id', 'trend1')
    .attr('width', plotWidth).attr('height', plotHeight)
    .attr('transform', "translate(" + 10 + "," + Number(height+10) + ")");

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
function buildAnnotations(g, x, y, plotHeight) {
  g.append('g').call(d3.axisBottom(x)).attr('transform', `translate(0, ${plotHeight})`);
  g.append('g').call(d3.axisLeft(y)).attr('transform', `translate(${margin.left},0)`);

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
    .attr("fill", "navy");
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
      .domain([0, yDomain.max])
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
      .attr('stroke-width', 2);
    trend2.selectAll('line').data(mappedData)
      .enter().append('path')
      .attr('d', d => lineEval_npa(d.data))
      .attr('stroke', d => color(d.key))
      .attr('fill', 'none')
      .attr('stroke-width', 2);

    // add titles & axes to the trend charts
    buildAnnotations(trend1, x, y, plotHeight);
    buildTitle(trend1, plotWidth, margin, "Month-on-Month Mortgage Delinquency rates")
    // add titles & axes to the trend charts
    buildAnnotations(trend2, x, y, plotHeight);
    buildTitle(trend2, plotWidth, margin, "Month-on-Month Mortgage NPA rates")

}
