(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){


var rotate = function(x,y, theta){
    return {
        'x': Math.cos(theta) * x - Math.sin(theta) * y,
        'y': Math.sin(theta) * x + Math.cos(theta) * y
    }
};
var norm2 =  function(a, b){
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
};

var translate = function(point, dpoint){
    return {
        'x': point.x + dpoint.x,
        'y': point.y + dpoint.y
    }
}


var pointInCircle = function(c, p){
    // Check if p is in circle
    return norm2(c.x - p.x, c.y - p.y) <= c.r
}



module.exports = {
    "rotate": rotate,
    "norm2": norm2,
    "translate": translate,
    "pointInCircle": pointInCircle
}
},{}],2:[function(require,module,exports){
var color = d3.scaleOrdinal()
    .range(d3.schemeCategory20);

module.exports = {
    'radius': 30,
    'nCircles': 50,
    "circleOpacity": 0.5,
    "triangleOpacity": 0.5,
    "triangleColor": 'turquoise',
    "edgeColor": 'black',
    "nodeColor": 'black',
    "blobColor": 'orange', //function(d, i) { return color(i); };
    "timeSteps": 150,
    "momentum": 0.8,
    "offset": 0.5, // how far each blob moves
    "persistenceStepSize":1
}
},{}],3:[function(require,module,exports){
var configs = require('./config');
var nervePieces = require('./nervePieces.js');

var parentDiv = document.getElementById("visual_space");
var svg = d3.select(parentDiv).append("svg");

console.log(parentDiv.clientWidth)
console.log(parentDiv.innerWidth)
var width = parentDiv.clientWidth;
var height = 600

svg.attr('width', width)
    .attr('height', height)

var margin = {right: 0, left: width*0.025, top: 20, bottom: 50};

var circles = nervePieces.randomCircles(configs, width, height);

nervePieces.drawNodes(svg, circles, configs)
    .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

function dragstarted(d) {
    d3.select(this).raise().classed("active", true);
}

function dragged(d) {
    d3.select(this).select(".blob")
    .attr("cx", d.x = d3.event.x)
    .attr("cy", d.y = d3.event.y);

    d3.select(this).select(".vertex")
    .attr("cx", d.x = d3.event.x)
    .attr("cy", d.y = d3.event.y);

    nervePieces.drawNerve(svg, circles)
}

function dragended(d) {
    d3.select(this).classed("active", false);
} 

nervePieces.drawNerve(svg, circles)

var topRange = width/8,
bottomRange = 5;

/// Handle slider
var x = d3.scaleLinear()
    .domain([bottomRange, topRange])
    .range([0, width / 2])
    .clamp(true);

var slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function() { change_r(x.invert(d3.event.x)); }));

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);

slider.transition() // Gratuitous intro!
    .duration(750)
    .tween("change_r", function() {
    var i = d3.interpolate(bottomRange, (topRange - bottomRange)/4+bottomRange);
    return function(t) { change_r(i(t)); };
});

function change_r(r) {
    handle.attr("cx", x(r));

    circles.forEach(d => {d.r = r});

    // Update the circles' positions according to the data.
    var gs = d3.selectAll("g");
    gs.select(".blob")
    .attr("r", d=>d.r);

    nervePieces.drawNerve(svg, circles);
}







},{"./config":2,"./nervePieces.js":5}],4:[function(require,module,exports){
var basicmath = require('./basicmath');

var nerveCondition2 =  function(a, b){
    // check that points a and b satisfy the nerve condition
    var distance = basicmath.norm2(a.x - b.x, a.y - b.y)
    return distance <= (a.r + b.r);
};


var circleIntersections = function(circleA, circleB){

    var root = circleB.x < circleA.x ? circleB : circleA

    // assume circles are both along the x-axis, no y coordinate
    var d = Math.sqrt( Math.pow(circleA.x - circleB.x, 2) + Math.pow(circleA.y - circleB.y, 2)) / 2
    var y = Math.sqrt( Math.pow(root.r, 2) - Math.pow(d, 2))

    dx = (circleB.x - circleA.x) / 2.0
    dy = (circleB.y - circleA.y) / 2.0

    var angle = Math.atan(dy / dx)
    point1 = basicmath.rotate(d, y, angle)
    point2 = basicmath.rotate(d, -y, angle)
    point1 = basicmath.translate(point1, root)
    point2 = basicmath.translate(point2, root)
    return [point1, point2]
}

var nerveCondition3 = function(a, b, c){
    if (nerveCondition2(a, b) && 
        nerveCondition2(b, c) && 
        nerveCondition2(a, c)){
        intersections1 = circleIntersections(a,b)
        intersections2 = circleIntersections(a,c)
        intersections3 = circleIntersections(b,c)
        if (basicmath.pointInCircle(c, intersections1[0]) || 
            basicmath.pointInCircle(c, intersections1[1]) ||
            basicmath.pointInCircle(b, intersections2[0]) || 
            basicmath.pointInCircle(b, intersections2[1]) || 
            basicmath.pointInCircle(a, intersections3[0]) || 
            basicmath.pointInCircle(a, intersections3[1])) {
        return true
        } else {
        return false
        }
    } else {
        return false
    }
}
    

var findTriangles = function(nodes, circles, radius){
    // Find all valid triangles in nerve
    trianglesData = []
    for (i = 0; i < nodes.length - 2; i += 1){
        for (j = i+1; j < nodes.length - 1; j += 1){
        for (k = j+1; k < nodes.length; k += 1){
            if (nerveCondition3(circles[nodes[i]], circles[nodes[j]], circles[nodes[k]], radius)){
            trianglesData.push({"a": nodes[i], "b": nodes[j], "c": nodes[k]})
            }
        }
        }
    }
    return trianglesData
}


var findEdges = function(circles, radius){
    // Find all valid edges in nerve
    edgesData = []
    for (var i=0; i < circles.length - 1; i += 1){
        for (var j=i+1; j < circles.length; j += 1){
        if (nerveCondition2(circles[i], circles[j], radius)){
            edgesData.push({"s": i, "t": j})
        }
        }
    }
    return edgesData
} 
    
    
module.exports = {
    "findTriangles": findTriangles,
    "findEdges": findEdges,
}
},{"./basicmath":1}],5:[function(require,module,exports){
// var basicmath = require('./basicmath.js');
var nerveComps = require('./nerveComputations.js');
var configs = require('./config');

var randomCircles = function(configs, width, height){
    var circles = d3.range(configs.nCircles).map(function() {
    return {
        x: Math.round(Math.random() * (width - configs.radius * 2) + configs.radius),
        y: Math.round(Math.random() * (height - configs.radius * 2) + configs.radius),
        r: configs.radius,
        dx: Math.random(),
        dy: Math.random(),
    };
    });

    return circles
};

// Update edge data
var addEdges = function(svg, edgesData, circles){
    svg.selectAll(".edge").remove();

    svg.selectAll(".edge")
    .data(edgesData).enter().append('path')
    .attr("class", "edge")
    .attr('d', function(d) {
        return 'M '+circles[d.s].x+' '+circles[d.s].y+' L '+ circles[d.t].x +' '+circles[d.t].y
    })
    .attr("stroke", configs.edgeColor)
    .attr("stroke-width", 2)
}

var addTriangles = function(svg, triangleData, circles){
    svg.selectAll(".triangle").remove();

    svg.selectAll(".triangle")
    .data(triangleData).enter().append('polygon')
    .attr("class", "triangle")
    .attr("points", function(d){
        return ''+circles[d.a].x+","+circles[d.a].y+" "+circles[d.b].x+","+circles[d.b].y+" "+circles[d.c].x+","+circles[d.c].y+" "
    })
    // .transition()
    // .duration(1250)
    .attr("fill", configs.triangleColor)
    .attr("fill-opacity", configs.triangleOpacity)
    .attr("stroke", "purple")
    .attr("stroke-width", 1)
}

var flattenEdges = function(edges){
    // Find a set of all edges
    ed = new Set();
    for (var i = 0; i < edges.length; i += 1){
    ed.add(edges[i].s);
    ed.add(edges[i].t);
    }
    
    return Array.from(ed)
}

var drawNerve = function(svg, circles){
    // Draw edges and triangles
    var edgesData = nerveComps.findEdges(circles, configs.radius)
    addEdges(svg, edgesData, circles)

    if (edgesData.length > 0){
    nodesInEdges = flattenEdges(edgesData)
    triangles = nerveComps.findTriangles(nodesInEdges, circles, configs.radius)
    addTriangles(svg, triangles, circles)
    }
    // bring vertices to the front
    svg.selectAll(".vertex").enter();
}

var drawNodes = function(svg, circles, configs){
    var group = svg.selectAll('g')
    .data(circles)
    .enter().append("g")

    group.append("circle")
    .attr("class", "blob")
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", configs.radius)
    .attr("fill-opacity", configs.circleOpacity)
    .style("fill", configs.blobColor)

    group.append("circle")
    .attr("class", "vertex")
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", 5)
    .style("fill", configs.nodeColor);

    return group;
}


module.exports = {
    'drawNerve': drawNerve,
    'drawNodes': drawNodes,
    'randomCircles': randomCircles
}

},{"./config":2,"./nerveComputations.js":4}]},{},[3]);
