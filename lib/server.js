var href = require('href')
  , http = require('http')
  , dgate = require('../')

module.exports = function (options) {
  var log = dgate.log(options);
  var proxy = dgate.proxy(options);
  var server = http.createServer(function (req, res) {
    href(req, res, function () {
      var vhost = dgate.match(options.vhosts, req);
      if (!vhost) {
        if (options.verbose) log.request('NULL', req.method, req.url, req.headers);
        res.writeHead(404);
        return res.end();
      }
      if (vhost.canonical && req.href.hostname !== vhost.canonical) {
        var redirect = vhost.canonical;
        if (!~redirect.indexOf('http')) redirect = 'http' + (vhost.https ? 's' : '') + '://' + redirect;
        redirect += req.href.path;
        res.writeHead(301, {'Location': redirect});
        return res.end();
      }
      if (vhost.https && req.href.protocol !== 'https:') {
        res.writeHead(301, {'Location': req.href.href.replace(/^http:/, 'https:')});
        return res.end();
      }
      res.once('proxyMeta', function (meta) {
        log.request(vhost.target, req.method, req.url, req.headers, meta.statusCode, meta.size);
      });
      proxy.web(req, res, {target: vhost.target});
    });
  });
  server.on('upgrade', function (req, socket, head) {
    var vhost = dgate.match(options.vhosts, req);
    if (vhost) {
      if (options.verbose) log.request(vhost.target, 'UPGRADE', req.url, req.headers);
      proxy.ws(req, socket, head, {target: vhost.target}, function (err, req, socket) {
        log.error(err, vhost.target, req.method, req.url, req.headers);
        socket.destroy();
      });
    }
  });

  server.proxy = proxy;
  server.log = log;
  return server;
};
