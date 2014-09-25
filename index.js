var cluster = require('cluster')
  , http = require('http')
  , httpProxy = require('http-proxy')
  , pkg = require('./package.json')
  , dollop = require('dollop')
  , parse = require('./parse')
  , match = require('./match')
  , addr = require('addr')

var cli = require('commander')
  .version(pkg.version)
  .description(pkg.description)
  .option('-p, --port <port>', 'port to listen on (default: 8080)', Number, 8080)
  .option('-w, --workers <num>', 'number of workers to fork (default: CPU count)', Number, require('os').cpus().length)
  .option('-h, --hostfile <path>', 'path to hosts file (default: /etc/hosts)', String, '/etc/hosts')
  .option('-v, --verbose', 'verbose request logging')
  .option('--no-header', 'do not add X-Gate header')
  .option('--setuid <uid|username>', '(POSIX, requires root) run under this uid (or username)')
  .option('--setgid <gid|groupname>', '(POSIX, requires root) run under this gid (or groupname)')
  .parse(process.argv)

var options = {
  port: cli.port,
  workers: cli.workers,
  hostfile: cli.hostfile,
  verbose: cli.verbose,
  header: cli.header,
  setuid: cli.setuid,
  setgid: cli.setgid
};

if (cluster.isMaster) {
  makeMaster(options);
}
else {
  makeWorker(options);
}

function log () {
  var args = [].slice.call(arguments).map(function (arg) {
    return JSON.stringify(arg);
  }).join(' ');
  console.log(new Date() + ' [message]', args);
}

function logRequest () {
  var args = [].slice.call(arguments).map(function (arg) {
    return JSON.stringify(arg);
  }).join(' ');
  console.log(new Date() + ' [request]', args);
}

function error () {
  var args = [].slice.call(arguments).map(function (arg) {
    return JSON.stringify(arg);
  }).join(' ');
  console.error(new Date() + ' [error]', args);
}

function makeMaster (options) {
  var latch = options.workers;
  var d = dollop([options.hostfile]);
  cluster.on('fork', function (worker) {
    function sendOptions (msg) {
      if (msg === 'options') {
        worker.send('options:' + JSON.stringify(options));
        if (!--latch) log('domain gate ready on port ' + options.port);
      }
    }
    worker.on('message', sendOptions);
  });
  cluster.on('disconnect', function (worker) {
    error('worker ' + worker.process.pid + ' disconnected. killing...');
    worker.kill();
  });
  cluster.on('exit', function (worker, code, signal) {
    var exitCode = worker.process.exitCode;
    error('worker ' + worker.process.pid + ' died (' + exitCode + '). restarting...');
    latch++;
    cluster.fork();
  });
  d.on('scan', function (files) {
    if (files.length) {
      var hostfile = files[0].data({encoding: 'utf8'});
      options.vhosts = parse(hostfile);
      if (d.ready) {
        Object.keys(cluster.workers).forEach(function (id) {
          cluster.workers[id].send('options:' + JSON.stringify(options));
        });
        log('updated options', options);
      }
      else {
        log('starting with options', options);
        for (var i = 0; i < options.workers; i++) cluster.fork();
      }
    }
    else {
      throw new Error('hostfile not found!');
    }
  });
}

function makeWorker (options) {
  var listening = false;
  var proxy = httpProxy.createProxyServer();
  proxy.on('error', function (err, req, res, target) {
    error(err, addr(req), target, req.method, req.url, req.headers);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('There was an error fulfilling your request. Please try again later.');
  });
  proxy.on('proxyReq', function (proxyReq, req, res, _opts) {
    if (options.header) proxyReq.setHeader('X-Gate', pkg.name + '/' + pkg.version);
    if (options.verbose) {
      proxyReq.once('response', function (proxyRes) {
        var meta = {size: 0};
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
  var server = http.createServer(function (req, res) {
    var vhost = match(options.vhosts, req);
    if (!vhost) {
      if (options.verbose) logRequest('NULL', req.method, req.url, req.headers);
      res.writeHead(404);
      return res.end();
    }
    res.once('proxyMeta', function (meta) {
      logRequest(vhost.target, req.method, req.url, req.headers, meta.statusCode, meta.size);
    });
    proxy.web(req, res, {target: vhost.target});
  });
  server.on('upgrade', function (req, socket, head) {
    var vhost = match(options.vhosts, req);
    if (vhost) {
      if (options.verbose) logRequest(vhost.target, addr(req), 'UPGRADE', req.url, req.headers);
      proxy.ws(req, socket, head, { target: vhost.target }, function (err, req, socket) {
        error(err, addr(req), vhost.target, req.method, req.url, req.headers);
        socket.destroy();
      });
    }
  });
  server.on('listening', function () {
    if (options.setgid) process.setgid(options.setgid);
    if (options.setuid) process.setuid(options.setuid);
  });
  function getOptions (msg) {
    var parts = msg.split(':');
    if (parts[0] === 'options') {
      options = JSON.parse(parts.slice(1).join(':'));
      if (!listening) {
        server.listen(options.port);
        listening = true;
      }
    }
  }
  process.on('message', getOptions);
  process.send('options');
  return server;
}
