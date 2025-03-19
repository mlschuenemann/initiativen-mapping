const jsonURL =
  "https://mlschuenemann.github.io/initiative-mapping-data/graph.json";

// Function to fetch the JSON data from either the local or hosted file
async function fetchData() {
  try {
    const response = await fetch(jsonURL);
    const data = await response.json();
    updatePlugin(data);
  } catch (error) {
    console.error("Error fetching the JSON file:", error);
  }
}

fetchData();

// Function to update the D3 chart using the fetched data
function updatePlugin(data) {
  const chart = () => {

    const width = window.innerWidth;
    const height = window.innerHeight;

    const links = data.links.map((d) => ({ ...d }));
    const nodes = data.nodes.map((d) => ({ ...d }));

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(300)
      )
      .force(
        "charge",
        d3.forceManyBody().strength(-3000) // Increase repulsion to avoid node overlap
      )
      .force(
        "collide",
        d3.forceCollide().radius((d) => (d.style?.radius || 10) + 10)
      )
      .force("x", d3.forceX().strength(0.05))
      .force("y", d3.forceY().strength(0.05));

    // Create the SVG container inside the #chart div.
    const svg = d3
      .select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    const g = svg.append("g");

    svg.call(
      d3
        .zoom()
        .scaleExtent([0.2, 10]) // Set zoom range
        .filter((event) => {
          // Allow zooming only if the user holds Ctrl or uses pinch gestures
          return event.type === "wheel" ? event.ctrlKey || event.metaKey : true;
        })
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        })
    );

    // Add a line for each link, and a circle for each node.
    const link = g
      .append("g")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.2)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 5);

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => d.style?.radius || 10)
      .attr("fill", (d) => d.style?.color || "#888")
      .attr("stroke", (d) => d.style?.stroke_color || "#fff")
      .attr("stroke-width", (d) => d.style?.stroke_width || 1.5)
      // Add this within the click event for each node
      .on("click", (event, d) => {
        if (d.web_links) {
            window.open(d.web_links, "_blank");
        }
    })

    const labels = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dy", (d) => d.style?.y_label || -12)
      .attr("text-anchor", "middle")
      .text((d) => d.title)
      .attr("font-size", (d) => d.style?.font_size || "10px")
      .attr("font-family", "sans-serif")
      .attr("font-weight", (d) => d.style?.font_weight || "normal")
      .attr("fill", (d) => d.style?.font_color || "black")
      .style("pointer-events", "none");
    // Add drag behavior.
    node.call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

    // Set the position attributes of links and nodes each time the simulation ticks.
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    // Define the original color and radius for reset
    const originalColor = "#888";
    const originalStrokeColor = "#fff";
    const originalRadius = 10;

    // Define colors for highlighting and graying out
    const highlightColor = "#333";
    const grayColor = "lightgray";

    // Add mouseover and mouseout events for nodes
    node.on("mouseover", (event, d) => {
      const connectedNodes = new Set();
      const connectedLinks = [];
      links.forEach((link) => {
        if (link.source.id === d.id) {
          connectedNodes.add(link.target.id);
          connectedLinks.push(link);
        } else if (link.target.id === d.id) {
          connectedNodes.add(link.source.id);
          connectedLinks.push(link);
        }
      });

      // Highlight connected nodes and gray out all others
      node
        .transition()
        .duration(200)
        .attr("fill", (n) => {
          if (connectedNodes.has(n.id)) {
            return highlightColor;
          } else if (n.id === d.id) {
            return highlightColor;
          } else {
            return grayColor;
          }
        })
        .attr("stroke", (n) =>
          connectedNodes.has(n.id) || n.id === d.id ? "#fff" : grayColor
        ) // Light stroke for highlighted nodes
        .attr("stroke-width", (n) =>
          connectedNodes.has(n.id) || n.id === d.id ? 2 : 1
        ); // Increase stroke width for highlighted nodes

      labels
        .transition()
        .duration(200)
        .attr("fill", (n) => {
          if (n.id === "10" || n.id === "11" || n.id === "12") {
            return "white"; // Change to white when hovering
          } else {
            return n.style?.font_color || "black"; // Keep original color for others
          }
        });
      link
        .transition()
        .duration(200)
        .attr("stroke", (l) => (connectedLinks.includes(l) ? "black" : "#999"))
        .attr("stroke-width", (l) => (connectedLinks.includes(l) ? 3 : 5))
        .attr("stroke-opacity", (l) => (connectedLinks.includes(l) ? 1 : 0.2)); // Make highlighted links more opaque
    });

    node.on("mouseout", (event, d) => {
      // Reset colors on mouse out
      node
        .transition()
        .duration(200) // Transition duration for smooth effect
        .attr("fill", (n) => n.style?.color || originalColor)
        .attr("stroke", (n) => n.style?.stroke_color || originalStrokeColor)
        .attr("stroke-width", (n) => n.style?.stroke_width || 1.5);

      labels
        .transition()
        .duration(200)
        .attr("fill", (n) => n.style?.font_color || "black");

      link
        .transition()
        .duration(200)
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.2);
    });

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

   function dragged(event) {
      // Get the width and height of the SVG (viewport boundaries)
      const width = 1900;
      const height = 1620;

      // Clamp the node's new x and y positions to stay within the SVG boundaries
      event.subject.fx = Math.max(-width / 2, Math.min(width / 2, event.x));
      event.subject.fy = Math.max(-height / 2, Math.min(height / 2, event.y));
    }


    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  chart();
}
