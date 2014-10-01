var href = require('href')
  , http = require('http')
  , dgate = require('../')
  , addr = require('addr')

module.exports = function (options) {
  var log = dgate.log(options);
  var proxy = dgate.proxy(options);
  var server = http.createServer(function (req, res) {
    var ip = addr(req);
    href(req, res, function () {
      var vhost = dgate.match(server.vhosts, req);
      if (!vhost) {
        if (options.verbose) log.request(ip, 'NULL', req.method, req.url, req.headers);
        res.writeHead(404);
        return res.end();
      }
      if (vhost.canonical && req.href.hostname !== vhost.canonical) {
        var redirect = vhost.canonical;
        if (!~redirect.indexOf('http')) redirect = 'http' + (vhost.https ? 's' : '') + '://' + redirect;
        redirect += req.href.path;
        res.writeHead(301, {'Location': redirect});
        log.request(ip, vhost.target, req.method, req.url, 301, 0, req.headers, res.headers);
        return res.end();
      }
      if (vhost.redirect) {
        var redirect = dgate.tokens(vhost.redirect, req);
        if (!~redirect.indexOf('http')) redirect = 'http://' + redirect;
        res.writeHead(301, {'Location': redirect});
        return res.end();
      }
      if (vhost.https && req.href.protocol !== 'https:') {
        res.writeHead(301, {'Location': req.href.href.replace(/^http:/, 'https:')});
        return res.end();
      }
      var target = dgate.tokens(vhost.target, req);
      if (options.verbose) {
        res.once('proxyMeta', function (meta) {
          log.request(ip, target, req.method, req.url, meta.statusCode, meta.size, req.headers, meta.headers);
        });
      }
      if (vhost.sethost) req.headers['host'] = vhost.sethost;
      proxy.web(req, res, {target: target});
    });
  });
  server.on('upgrade', function (req, socket, head) {
    var vhost = dgate.match(server.vhosts, req);
    if (vhost) {
      if (options.verbose) log.request(ip, vhost.target, 'UPGRADE', req.url, req.headers);
      proxy.ws(req, socket, head, {target: vhost.target}, function (err, req, socket) {
        log.error(ip, err, vhost.target, req.method, req.url, req.headers);
        socket.destroy();
      });
    }
  });

  server.vhosts = options.vhosts;
  server.proxy = proxy;
  server.log = log;
  return server;
};
