var dollop = require('dollop')
  , cluster = require('cluster')

module.exports = function (options) {
  var latch = options.workers;
  var d = dollop([options.hostfile], options);
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
        if (options.verbose) log('updated options', options);
      }
      else {
        if (options.verbose) log('starting with options', options);
        for (var i = 0; i < options.workers; i++) cluster.fork();
      }
    }
    else {
      throw new Error('hostfile not found!');
    }
  });
};
