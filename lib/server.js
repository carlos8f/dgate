var href = require('href')
  , http = require('http')
  , dgate = require('../')
  , addr = require('addr')
  , dish = require('dish')

module.exports = function (options) {
  var log = dgate.log(options);
  var proxy = dgate.proxy(options);
  var server = http.createServer(function (req, res) {
    req.ip = addr(req);
    href(req, res, function () {
      var vhost = dgate.match(server.vhosts, req);
      if (!vhost) {
        log.request(req.ip, 'NULL', req.method, req.url, req.headers);
        res.writeHead(404);
        return res.end();
      }
      if (vhost.canonical && req.href.hostname !== vhost.canonical) {
        var redirect = vhost.canonical;
        if (!~redirect.indexOf('http')) redirect = 'http' + (vhost.https ? 's' : '') + '://' + redirect;
        redirect += req.href.path;
        res.writeHead(301, {'Location': redirect});
        log.request(req.ip, vhost.target, req.method, req.url, 301, 0, req.headers, res.headers);
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
      if (vhost.file) {
        if (options.verbose) {
          var size = 0;
          res.on('data', function (data) {
            size += data.length;
          });
          res.once('end', function () {
            log.request(req.ip, 'FILE', req.method, req.url, res.statusCode, size, req.headers, res.headers);
          });
        }
        dish.file(dgate.tokens(vhost.file, req))(req, res, function (err) {
          log.error(req.ip, err, vhost.target, req.method, req.url, req.headers);
        });
        return;
      }
      var target = dgate.tokens(vhost.target, req);
      if (options.verbose) {
        res.once('proxyMeta', function (meta) {
          log.request(req.ip, target, req.method, req.url, meta.statusCode, meta.size, req.headers, meta.headers);
        });
      }
      if (vhost.sethost) req.headers['host'] = vhost.sethost;
      proxy.web(req, res, {target: target});
    });
  });
  server.on('upgrade', function (req, socket, head) {
    var vhost = dgate.match(server.vhosts, req);
    if (vhost) {
      log.request(req.ip, vhost.target, 'UPGRADE', req.url, req.headers);
      proxy.ws(req, socket, head, {target: vhost.target}, function (err, req, socket) {
        log.error(req.ip, err, vhost.target, req.method, req.url, req.headers);
        socket.destroy();
      });
    }
  });

  server.vhosts = options.vhosts;
  server.proxy = proxy;
  server.log = log;
  return server;
};
