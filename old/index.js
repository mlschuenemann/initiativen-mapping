var svg = d3.select("svg");
var width = svg.attr("width");
var height = svg.attr("height");

var graph = {
    nodes: [
        { name: "A"},
        { name: "B"},
        { name: "C"},
        { name: "D"},
        { name: "E"},
        { name: "F"},
        { name: "G"},
        { name: "H"},
        { name: "J"},
        { name: "K"}
    ],
    links: [
        { source: "A", target: "B"},
        { source: "B", target: "C"},
        { source: "C", target: "D"},
        { source: "D", target: "F"},
        { source: "F", target: "G"},
    ]
};

var simulation = d3.forceSimulation(graph.nodes)
    .force("link", d3.forceLink(graph.links)
    .id(function(d){
        return d.name
})
).force("charge", d3.forceManyBody().strength(-30))
.force("center", d3.forceCenter(width / 2, height / 2))
.on("tick", ticked);

var link = svg.append("g").selectAll("line").data(graph.links).enter().append("line").attr("stroke-width", function(d){
    return 3;
}).style("stroke", "pink");

var node = svg.append("g")
.selectAll("circle")
.data(graph.nodes)
.enter()
.append("circle")
.attr("r", 5)
.attr("fill", function(d){
    return "orange";
})
.attr("stroke", "yellow");

var drag = d3.drag()
.on("start", dragStarted)
.on("drag", dragged)
.on("end", dragEnded);

node.call(drag);


function ticked(){
    link
    .attr("x1", function(d){
        return d.source.x;
    })
    .attr("y1", function(d){
        return d.source.y;
    })
    .attr("x2", function(d){
        return d.target.x;
    })
    .attr("y2", function(d){
        return d.target.y;
    });

    node
    .attr("cx", function(d){
        return d.x;
    })
    .attr("cy", function(d){
        return d.y;
    });
}
