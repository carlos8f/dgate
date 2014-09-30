var code = 65, latch = 3, servers = {};

(function doNext () {
  var letter = String.fromCharCode(code++);
  var server = require('http').createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(letter);
  });
  server.listen(0, function () {
    servers[letter] = server.address().port;
    if (!--latch) console.log(JSON.stringify(servers));
    else doNext();
  });
})();
