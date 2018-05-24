var httpProxy = require('http-proxy')
  , dgate = require('../')
  , addr = require('addr')

module.exports = function (options) {
  var log = dgate.log(options);
  var proxy = httpProxy.createProxyServer();
  proxy.on('error', function (err, req, res, target) {
    log.error(err, target, req.method, req.url, req.headers);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('There was an error fulfilling your request. Please try again later.');
  });
  proxy.on('proxyReq', function (proxyReq, req, res, _opts) {
    if (options.header) {
      proxyReq.setHeader('X-Gate', dgate.pkg.name + '/' + dgate.pkg.version);
      res.setHeader('X-Gate', dgate.pkg.name + '/' + dgate.pkg.version);
    }
    res.setHeader('X-Forwarded-For', (addr(req, options.proxies) || '').replace('::ffff:', ''))
    if (options.sslCert || req.href.protocol === 'https:') {
      proxyReq.setHeader('X-Forwarded-Proto', 'https');
    }
    if (options.verbose) {
      proxyReq.once('response', function (proxyRes) {
        var meta = {size: 0, headers: proxyRes.headers};
        proxyRes.on('data', function (data) {
          meta.size += data.length;
        });
        proxyRes.once('end', function () {
          meta.statusCode = proxyRes.statusCode;
          res.emit('proxyMeta', meta);
        });
      });
    }
  });

  proxy.log = log;
  return proxy;
};
