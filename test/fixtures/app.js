var code = 65, latch = 3, servers = {}, href = require('href');

(function doNext () {
  var letter = String.fromCharCode(code++);
  var server = require('http').createServer(function (req, res) {
    href(req, res, function () {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(letter + ',' + req.href.hostname);
    });
  });
  server.listen(0, function () {
    servers[letter] = server.address().port;
    if (!--latch) console.log(JSON.stringify(servers));
    else doNext();
  });
})();
