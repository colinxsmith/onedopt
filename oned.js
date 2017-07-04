var Optimise = function(ww,hh,toDraw,damper,funcDomain){
  var grad = function(x, func) {
    return ( (func(x + 1e-5) - func(x - 1e-5)) / 2e-5) ;
}
  , svgm = d3.select('.test').append('svg')
  , border = 5
  , xp = []
  , dotpos = 15
  , outerborder = svgm.append('rect').attr("class", "border").attr('x', border).attr('y', border).attr('width', ww - border * 2).attr('height', hh - border * 2)
  , margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 40
}
  , width = ww - margin.left - margin.right
  , height = hh - margin.top - margin.bottom
  , xmax = -1e16
  , xmin = 1e16
  , ymin = 1e16
  , ymax = -1e16
  , datas = d3.scaleLinear().domain(funcDomain).ticks(10000).map(i=>{
    var x = i;
    var y = toDraw(x);
    xmin = Math.min(xmin, x);
    xmax = Math.max(xmax, x);
    ymin = Math.min(ymin, y);
    ymax = Math.max(ymax, y);
    return {
			x,
			y
		}
	}
	)
  , x = d3.scaleLinear().domain([xmin, xmax]).nice().range([0, width])
  , y = d3.scaleLinear().domain([ymin, ymax]).nice().range([height, 0])
  , xAxis = d3.axisBottom(x).tickSize(-height)//x grid lines
	.ticks(5)
  , yAxis = d3.axisLeft(y).tickSize(-width)//y grid lines
	.ticks(5);

var svg = svgm.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", `translate(${margin.left},${margin.top})`)
  , svgX = svg.append('g').attr('class', 'x axis').attr('transform', `translate(0, ${height})`).attr('class', 'axis').call(xAxis)
  , svgY = svg.append('g').attr('class', 'y axis').attr('class', 'axis').call(yAxis)
  , line = d3.line().x(function(d) {
		return xAxis.scale()(d.x);
	}).y(function(d) {
		return yAxis.scale()(d.y);
	})
  , svgLine = svg.datum(datas)
	  .append('path')
	  .attr('class', 'line')
	  .attr('d', line)
  , xp = d3.scaleLinear()
	  .domain(funcDomain)
	  .ticks(funcDomain[1] - funcDomain[0] + 1)
  , svgPoints = svg.selectAll('circle')
  .data(xp).enter()
  .append('circle')
  .attr('class', 'particles')
  .attr('cx', function(d) {
    return xAxis.scale()(d)
}).attr('cy', function(d) {
    return yAxis.scale()(toDraw(d))
}).attr('r', '3px')
  , svgBigdot = svg.append('circle')
  .attr('class', 'particle')
  .attr('cx', xAxis.scale()(dotpos))
  .attr('cy', yAxis.scale()(toDraw(dotpos)))
  .attr('r', '5px')
  .transition()
  .on("start", function repeat() {
		var step = -grad(dotpos, toDraw) * damper;
		//Steepest descent step
		if (Math.abs(step) > 1e-8) {
			d3.active(this).attr('cx', xAxis.scale()((dotpos += step))).attr('cy', yAxis.scale()(toDraw(dotpos))).attr('r', function() {
				var rad=Math.max(4,Math.abs(step));
				return `${rad}px`;
			}).transition().on("start", repeat);
		} else {
			//Write the results of the optimisation to a new circle onject, then the zooming works
			svgBigdot1.attr('cx', this.getAttribute('cx')).attr('cy', this.getAttribute('cy')).attr('r', this.getAttribute('r'));
			this.setAttribute('r', '0px');
			optPos.html(`Optimal position is ${dotpos.toFixed(5)}, function value is ${(toDraw(dotpos)).toFixed(1)}`);
		}
	})
  , svgBigdot1 = svg.append('circle')
	.attr('class', 'particle')
  , optPos = svg.append('text')
	.attr('class','optres')
	.attr('dx',20)
	.attr('dy',height-20)
	;

var rect = svg.append("rect")
	.attr('class', 'grapharea')
	.attr("width", width)
	.attr("height", height),
	zoomScaleX, zoomScaleY, 
	zoom = d3.zoom().on('start', function() {
		zoomScaleX = xAxis.scale();
		zoomScaleY = yAxis.scale();
	}).on('zoom', function() {
		var event = d3.event;
		var transform = event.transform;
		var newXScale = transform.rescaleX(zoomScaleX);
		xAxis.scale(newXScale);
		var newYScale = transform.rescaleY(zoomScaleY);
		yAxis.scale(newYScale);
		zoomed(event.transform);
	}).on('end', function() {
		rect.property('__zoom', d3.zoomIdentity);
	});
	
rect.call(zoom);

var zoomed = function() {
    svgX.call(xAxis);
    svgY.call(yAxis);
    svgLine.attr('d', line);
    svgPoints.attr('cx', function(d) {
        return xAxis.scale()(d)
    }).attr('cy', function(d) {
        return yAxis.scale()(toDraw(d))
    });
    console.log(dotpos);
    try {
        //Can't update svgBigdot on zoom... too late exception... see transtion() life-cycle rules
        svgBigdot
        .attr('cx', xAxis.scale()((dotpos)))
        .attr('cy', yAxis.scale()(toDraw(dotpos)));
    } catch (err) {
        console.log(err.message);
    }
    svgBigdot1
    .style('fill','red')
    .attr('cx', xAxis.scale()((dotpos)))
    .attr('cy', yAxis.scale()(toDraw(dotpos)));
};

// reset x & y  
d3.select('#resetXY').on('click', function() {
    xAxis.scale(x);
    yAxis.scale(y);
    zoomed();
})

d3.select('#resetY').on('click', function() {
    yAxis.scale(y);
    zoomed();
})
d3.select('#resetX').on('click', function() {
    xAxis.scale(x);
    zoomed();
})
rect.on('dblclick.zoom', null);
//disable
};
