var dgate = require('../')
  , spawn = require('child_process').spawn
  , request = require('request')
  , assert = require('assert')

describe('tests', function () {
  var servers, port;
  before(function (done) {
    var proc = spawn('node', [__dirname + '/fixtures/app.js']);
    proc.stdout.once('data', function (data) {
      servers = JSON.parse(data);
      done();
    });
    process.once('exit', function () {
      proc.kill();
    });
  });
  after(function (done) {
    if (server) {
      server.once('close', done);
      server.close();
    }
    else done();
  });
  it('server', function (done) {
    var options = {
      vhosts: []
    };
    Object.keys(servers).forEach(function (letter) {
      options.vhosts.push({
        host: letter.toLowerCase() + '.app.dev',
        path: '**',
        target: 'http://localhost:' + servers[letter],
        options: {}
      });
    });
    var server = dgate.server(options);
    server.listen(0, function () {
      port = server.address().port;
      done();
    });
  });
  it('request', function (done) {
    request('http://localhost:' + port + '/', function (err, resp, body) {
      assert.ifError(err);
      assert.equal(200, resp.statusCode);
      console.log(body);
      done();
    });
  });
});
