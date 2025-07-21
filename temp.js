const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  const filePath = path.join('src/node_modules/', 'init.js');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(data);
    console.log(data)
  });
}).listen(9967, () => {
  console.log('Serving init.js on port 9967 with CORS enabled');
});
