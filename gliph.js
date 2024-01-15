// Set the dimensions and margins of the graph
const margin = { top: 40, right: 50, bottom: 0, left: 80 },
	width = window.innerWidth - margin.left - margin.right,
	height = 600 - margin.top - margin.bottom;

// Append the svg object to the body of the page
const svg = d3
	.select('#graph')
	.append('svg')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
	.attr('transform', `translate(${margin.left}, ${margin.top})`);

// Get the data
d3.csv('./data/kills-injuries-gaza.csv').then(function (data) {
	// Data column names: Killed, Injured
	const keys = data.columns.slice(1);

	const parseDate = d3.timeParse('%d-%m-%Y');
	const formatDate = d3.timeFormat('%d-%m-%Y');

	// Process data: transform dates and remove commas
	const dates = data.map((d) => {
		d.Date = parseDate(d.Date);
		return d.Date;
	});
	[...data].forEach((d) => {
		keys.forEach((k) => {
			d[k] = parseInt(d[k].replace(/,/g, ''));
		});
	});

	// Add X axis
	const x = d3
		.scaleLinear()
		.domain(
			d3.extent(data, function (d) {
				return d.Date;
			})
		)
		.range([0, width]);

	svg
		.append('g')
		.attr('transform', `translate(0, ${height - 55})`)
		.call(
			d3
				.axisBottom(x)
				.tickSize(-height + 55)
				.tickValues(dates)
				.tickFormat(formatDate)
		)
		.select('.domain')
		.remove();

	// Ticks customization
	svg.selectAll('.tick line').attr('stroke', '#b8b8b8');
	svg
		.selectAll('.tick text')
		.attr('y', 10)
		.attr('color', '#b8b8b8')
		.attr('transform', 'rotate(-70) translate(-30, -10)');
	svg
		.selectAll('.tick')
		.on('mouseover', function (event, d) {
			d3.select(this).select('line').style('stroke', '#000');
			d3.select(this)
				.select('text')
				.style('color', '#000')
				.style('font-weight', 'bold');
		})
		.on('mouseout', function (event, d) {
			d3.select(this)
				.select('line')
				.style('stroke', d3.select(this).attr('stroke'));
			d3.select(this)
				.select('text')
				.style('color', d3.select(this).attr('color'))
				.style('font-weight', 'normal');
		});

	// Add X axis label
	svg
		.append('text')
		.attr('text-anchor', 'end')
		.attr('x', width + margin.left + 10)
		.attr('y', height - 30)
		.attr('transform-origin', `${width + margin.left + 10} ${height - 30}`)
		.attr('transform', 'rotate(-90) translate(50, -60)')
		.text('Time (days)');

	// Add Y axis
	const y = d3
		.scaleLinear()
		.domain([
			-d3.max(data, (d) => d3.max(keys, (key) => d[key])),
			d3.max(data, (d) => d3.max(keys, (key) => d[key])),
		])
		.range([height, 0]);
	svg.append('g').attr('transform', `translate(-30, 0)`).call(d3.axisLeft(y));

	// Add Y axis label
	svg
		.append('text')
		.attr('x', -margin.left + 10)
		.attr('y', -15)
		.text('Persons');

	// Color palette
	const color = d3.scaleOrdinal().domain(keys).range(d3.schemeDark2);

	//stack the data
	const stackedData = d3.stack().offset(d3.stackOffsetSilhouette).keys(keys)(
		data
	);

	// Create a tooltip
	const tooltip = d3.select('body').append('div').attr('class', 'tooltip');

	// Areas hover / leave / move interactions (tooltip and highlight)
	const mouseover = function (event, d) {
		tooltip.style('display', 'block').html(`<p>${d.key}</p>`);
		d3.selectAll('.myArea').style('opacity', 0.2);
		d3.select(this).style('stroke', 'black').style('opacity', 1);
	};
	const mousemove = function (event, d, i) {
		tooltip
			.style('left', `${event.pageX + 10}px`)
			.style('top', `${event.pageY + 10}px`);
	};
	const mouseleave = function (event, d) {
		tooltip.style('display', 'none');
		d3.selectAll('.myArea').style('opacity', 1).style('stroke', 'none');
	};

	// Area generator
	const area = d3
		.area()
		.x(function (d) {
			return x(d.data.Date);
		})
		.y0(function (d) {
			return y(d[0]);
		})
		.y1(function (d) {
			return y(d[1]);
		});

	// Show the areas
	svg
		.selectAll('mylayers')
		.data(stackedData)
		.join('path')
		.attr('class', 'myArea')
		.style('fill', function (d) {
			return color(d.key);
		})
		.attr('d', area)
		.on('mouseover', mouseover)
		.on('mousemove', mousemove)
		.on('mouseleave', mouseleave);
});
