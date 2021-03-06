var dollop = require('dollop')
  , cluster = require('cluster')
  , dgate = require('../')

module.exports = function (options) {
  var log = dgate.log(options);
  var latch = options.workers;
  var d = dollop([options.hostfile]);
  cluster.on('fork', function (worker) {
    function sendOptions (msg) {
      if (msg === 'options') {
        worker.send('options:' + JSON.stringify(options));
        if (!--latch) log.message('domain gate ready on port ' + options.port);
      }
    }
    worker.on('message', sendOptions);
  });
  cluster.on('disconnect', function (worker) {
    log.error('worker ' + worker.process.pid + ' disconnected. killing...');
    worker.kill();
  });
  cluster.on('exit', function (worker, code, signal) {
    var exitCode = worker.process.exitCode;
    log.error('worker ' + worker.process.pid + ' died (' + exitCode + '). restarting...');
    latch++;
    cluster.fork();
  });
  d.on('scan', function (files) {
    if (files.length) {
      var hostfile = files[0].data({encoding: 'utf8'});
      options.vhosts = dgate.parse(hostfile);
      if (d.ready) {
        Object.keys(cluster.workers).forEach(function (id) {
          cluster.workers[id].send('options:' + JSON.stringify(options));
        });
        log.message('updated options', options);
      }
      else {
        log.message('starting with options', options);
        for (var i = 0; i < options.workers; i++) cluster.fork();
      }
    }
    else {
      log.error('hostfile not found!');
    }
  });
};
