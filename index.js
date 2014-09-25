var cluster = require('cluster')
  , http = require('http')
  , httpProxy = require('http-proxy')
  , pkg = require('./package.json')
  , dollop = require('dollop')
  , minimatch = require('minimatch')
  , parse = require('./parse')
  , match = require('./match')

var cli = require('commander')
  .version(pkg.version)
  .description(pkg.description)
  .option('-p, --port <port>', 'port to listen on (default: 80)', Number, 80)
  .option('-w, --workers <num>', 'number of workers to fork (default: CPU count)', Number, require('os').cpus().length)
  .option('-h, --hostfile <path>', 'path to hosts file (default: /etc/hosts)', String, '/etc/hosts')
  .option('--setuid <uid|username>', '(POSIX, requires root) run under this uid (or username)')
  .option('--setgid <gid|groupname>', '(POSIX, requires root) run under this gid (or groupname)')
  .parse(process.argv)

var options = {
  port: cli.port,
  workers: cli.workers,
  hostfile: cli.hostfile,
  setuid: cli.setuid,
  setgid: cli.setgid,
  hosts: []
};

if (cluster.isMaster) {
  makeMaster(options);
}
else {
  makeWorker(options);
}

function makeMaster (options) {
  var latch = options.workers;
  cluster.on('fork', function (worker) {
    function sendOptions (msg) {
      if (msg === 'options') {
        worker.send('options:' + JSON.stringify(options));
        if (!--latch) console.log('domain gate ready.');
      }
    }
    worker.on('message', sendOptions);
  });
  cluster.on('disconnect', function (worker) {
    console.error('worker ' + worker.process.pid + ' disconnected. killing...');
    worker.kill();
  });
  cluster.on('exit', function (worker, code, signal) {
    var exitCode = worker.process.exitCode;
    console.error('worker ' + worker.process.pid + ' died (' + exitCode + '). restarting...');
    latch++;
    cluster.fork();
  });
  var d = dollop([options.hostfile]);
  d.on('scan', function (files) {
    options.hosts = [];
    if (files.length) {
      var hostfile = files[0].data({encoding: 'utf8'});
      options.vhosts = parse(hostfile);
      for (var i = 0; i < options.workers; i++) cluster.fork();
    }
    else {
      throw new Error('hostfile not found!');
    }
  });
}

function makeWorker (options) {
  var listening = false;
  var proxy = httpProxy.createProxyServer();
  var server = http.createServer(function (req, res) {
    var vhost = match(options.vhosts, req);
    if (!vhost) {
      res.writeHead(404);
      return res.end();
    }
    proxy.web(req, res, { target: vhost.target });
  });
  server.on('upgrade', function (req, socket, head) {
    var vhost = match(options.vhosts, req);
    if (vhost) proxy.ws(req, socket, head, { target: vhost.target });
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
