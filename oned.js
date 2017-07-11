var Optimise = function(ww,hh,toDraw,damper,funcDomain,dotpos,resetx,resety,resetxy){
	console.log(toDraw);
  var grad = function(x, func) {
    return ( (func(x + 1e-5) - func(x - 1e-5)) / 2e-5) ;
}
  , svgm = d3.select('body').append('svg')
  , border = 5
  , xp = []
  , outerborder = svgm.append('rect').attr("class", "border").attr('x', border).attr('y', border).attr('width', ww - border * 2).attr('height', hh - border * 2)
  , margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 60
}
  , width = ww - margin.left - margin.right
  , height = hh - margin.top - margin.bottom
  , xmax = -1e16
  , xmin = 1e16
  , ymin = 1e16
  , ymax = -1e16
  , datas = d3.scaleLinear().domain(funcDomain).ticks(50).map(i=>{
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
  , xAxis = d3.axisBottom(x)
	.tickSize(-height)//x grid lines
	.ticks(5)
  , yAxis = d3.axisLeft(y)
	.tickSize(-width)//y grid lines
	.ticks(5);

var svg = svgm.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", `translate(${margin.left},${margin.top})`)
  , svgX = svg.append('g').attr('transform', `translate(0, ${height})`).attr('class', 'axis').call(xAxis)
  , svgY = svg.append('g').attr('class', 'axis').call(yAxis)
  , line = d3.line()
	.x(function(d) {
		return xAxis.scale()(d.x);
	})
	.y(function(d) {
		return yAxis.scale()(d.y);
	})
	.curve(d3.curveCardinal.tension(0.5))
  , svgLine = svg.datum(datas)
	  .append('path')
	  .attr('class', 'line')
	  .attr('d', line)
  , xp = d3.scaleLinear()
	  .domain(funcDomain)
	  .ticks(funcDomain[1] - funcDomain[0] + 1)
  , svgPoints = svg.append('g').selectAll('circles')
  .data(xp).enter()
  .append('circle')
  .attr('class', 'particles')
  .attr('cx', function(d) {
    return xAxis.scale()(d)
}).attr('cy', function(d) {
    return yAxis.scale()(toDraw(d))
}).attr('r', '3px')
  , svgMovingPoint = svg.append('circle')
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
				var rad=Math.min(50,Math.max(10,Math.abs(step/damper)));
				return `${rad}px`;
			}).transition().on("start", repeat);
		} else {
			//Write the results of the optimisation to a new circle onject, then the zooming works
			svgMovingPointCopy.attr('cx', this.getAttribute('cx')).attr('cy', this.getAttribute('cy')).attr('r', this.getAttribute('r'));
			this.setAttribute('r', '0px');
			optPos.html(`Optimal position is ${dotpos.toFixed(3)}, function value is ${(toDraw(dotpos)).toFixed(3)}`);
		}
	})
  , svgMovingPointCopy = svg.append('g').append('circle')
	.attr('class', 'particle')
  , optPos = svg.append('text')
	.attr('class','optres')
	.attr('dx',20)
	.attr('dy',height-20)
	;
var rect = svg.append('g').append("rect")
	.attr('class', 'grapharea')
	.attr("width", width)
	.attr("height", height)
		,	zoomScaleX, zoomScaleY, 
	zoom = d3.zoom().on('start', function() {
		zoomScaleX = xAxis.scale();
		zoomScaleY = yAxis.scale();
	}).on('zoom', function() {
		var event = d3.event;
		var transform = event.transform;
		console.log(`${transform.k}:        (${transform.x} , ${transform.y})`);
		console.log(`Tool tip coordinates: (${tool.attr('pos')} , ${tool.attr('funcpos')})`);
		var newXScale = transform.rescaleX(zoomScaleX);
		xAxis.scale(newXScale);
		var newYScale = transform.rescaleY(zoomScaleY);
		yAxis.scale(newYScale);
		zoomed();
	}).on('end', function() {
		rect.property('__zoom', d3.zoomIdentity);
	});
var	tool = d3.select("body").append("rect").attr("class", "tool");
	
rect.call(zoom);
	rect
	.on('click',function(){
		var mouse=d3.mouse(this);
		var toolpos=[d3.event.pageX,d3.event.pageY];
//		var toolpos=[mouse[0],yAxis.scale()(toDraw(xAxis.scale().invert(mouse[0])))];
		if(Math.abs(yAxis.scale().invert(mouse[1]) - toDraw(xAxis.scale().invert(mouse[0]))) <  Math.abs(toDraw(xAxis.scale().invert(mouse[0])))){
		console.log(`x:${mouse[0]} y:${mouse[1]}`);
		console.log(`x:${d3.event.pageX} y:${d3.event.pageY}`);
		console.log(`x    = ${xAxis.scale().invert(mouse[0])}`);
		console.log(`f(x) = ${yAxis.scale().invert(mouse[1])} (${toDraw(xAxis.scale().invert(mouse[0]))})`);
		tool.html(`x    = ${xAxis.scale().invert(mouse[0])}<br>f(x) = ${toDraw(xAxis.scale().invert(mouse[0]))}`)
			.style("left", `${toolpos[0]}px`)
			.style("top", `${toolpos[1]}px`)
			.style("display", "inline-block")
				.transition()
				.duration(200)
			;
		tool.attr('pos',xAxis.scale().invert(toolpos[0]));
		tool.attr('funcpos',yAxis.scale().invert(toolpos[1]));
		}
		else{
		console.log((yAxis.scale().invert(mouse[1])  / toDraw(xAxis.scale().invert(mouse[0])) - 1));
		tool
		.style('display','none')
				.transition()
				.duration(200)
		;
		}
	})
/*	.on('mouseout',function(){
		tool.style("display", "none")
				.transition()
				.duration(200)
		;
	})*/
	;


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
        //Can't update svgMovingPoint on zoom... too late exception... see transtion() life-cycle rules
        svgMovingPoint
        .attr('cx', xAxis.scale()((dotpos)))
        .attr('cy', yAxis.scale()(toDraw(dotpos)));
    } catch (err) {
        console.log(err.message);
    }
    svgMovingPointCopy
    .style('fill','red')
    .attr('cx', xAxis.scale()(      (dotpos)))
    .attr('cy', yAxis.scale()(toDraw(dotpos)))
	;

	tool.style('left',(xAxis.scale()       (tool.attr('pos')) +'px'))
		.style('top', (yAxis.scale()   (tool.attr('funcpos')) +'px'));
};

// reset x & y  
d3.select(resetxy).on('click', function() {
    xAxis.scale(x);
    yAxis.scale(y);
    zoomed();
})

d3.select(resety).on('click', function() {
    yAxis.scale(y);
    zoomed();
})
d3.select(resetx).on('click', function() {
    xAxis.scale(x);
    zoomed();
})
rect.on('dblclick.zoom', null);
//disable



};
