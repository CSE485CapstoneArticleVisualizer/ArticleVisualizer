const http = require("http");
const d3 = require("d3");
const hostname = "127.0.0.1";
const port = 3000;

//Create HTTP server and listen on port 3000 for requests
const server = http.createServer((req, res) => {
  //Set the response HTTP header with HTTP status and Content type
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World\n");
});

//listen for request on port 3000, and as a callback function have the port listened on logged
server.listen(port, hostname, () => {
  const nodes = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const links = [{ source: "a", target: "b" }, { source: "a", target: "c" }];

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(0, 0));

  simulation.tick(300);

  // simulation.on('tick', () => {
  // 	console.log(nodes)
  // })

  console.log(nodes);

  console.log(`Server running at http://${hostname}:${port}/`);
});

console.log("Hello");
