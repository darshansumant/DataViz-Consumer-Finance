document.addEventListener("DOMContentLoaded", () => {
  // this uses a structure called a promise to asyncronously get the cars data set
  Promise.all([
    'https://raw.githubusercontent.com/ResidentMario/geoplot-data/master/contiguous-usa.geojson'
    ,'./data/yoy_del_rates_state.json'
  ].map(url => fetch(url)
    // convert to JSON & send to Chloropleth function
    .then(data => data.json())))
    .then(data => myVis(data))
    // Error handling - push log to console
    .catch(function(error) {
      console.log(error);
    })
});


function computeDomain(data, key) {
  return data.reduce((acc, row) => {
    return {
      min: Math.min(acc.min, row[key]),
      max: Math.max(acc.max, row[key])
    };
  }, {min: Infinity, max: -Infinity});
}

function myVis(data) {
  // this is an es6ism called a destructuring, it allows you to save and name argument
  // you tend to see it for stuff in object, (as opposed to arrays), but this is cool too
  const [stateShapes, stateDel] = data;
  const width = 1000;
  const height = 550;
  const margin = {
    top: 10,
    left: 10,
    right: 10,
    bottom: 10
  };
  // we're going to be coloring our cells based on their population so we should compute the
  // population domain
  const delDomain = computeDomain(stateDel, 'mean_del');
  // the data that we will be iterating over will be the geojson array of states, so we want to be
  // able to access the populations of all of the states. to do so we flip it to a object representation

  // Delinquency Rates by State
  const stateNameToDel = stateDel.reduce((acc, row) => {
    acc[row.Name] = row.mean_del;
    return acc;
  }, {});
  const delScale = d3.scaleLinear().domain([0, delDomain.max]).range([0, 1]);
  const colorScale = d => d3.interpolateViridis(delScale(d));  // linear interploation, not using sqrt

  // next we set up our projection stuff
  const projection = d3.geoAlbersUsa();
  const geoGenerator = d3.geoPath(projection);
  // then our container as usual
  const svg = d3.select('.vis-container')
    .attr('width', width)
    .attr('height', height)
    .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  // finally we construct our rendered states
  svg.selectAll('.state')
    .data(stateShapes.features)
    .enter()
    .append('path')
      .attr('class', 'state')
      .attr('stroke', 'black')
      .attr('fill', d => colorScale(stateNameToDel[d.properties.State]))
      .attr('d', d => geoGenerator(d));

}
