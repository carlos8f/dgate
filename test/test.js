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
  it('server 1', function (done) {
    var options = {
      vhosts: []
    };
    Object.keys(servers).forEach(function (letter) {
      options.vhosts.push({
        host: letter.toLowerCase() + '.app.dev',
        path: '**',
        target: 'http://localhost:' + servers[letter]
      });
    });
    server = dgate.server(options);
    server.listen(0, function () {
      port = server.address().port;
      done();
    });
  });
  it('request 1', function (done) {
    request('http://localhost:' + port + '/', function (err, resp, body) {
      assert.ifError(err);
      assert.equal(404, resp.statusCode);
      server.close();
      done();
    });
  });
  it('server 2', function (done) {
    var options = {
      vhosts: [],
      header: true
    };
    Object.keys(servers).forEach(function (letter) {
      options.vhosts.push({
        host: letter.toLowerCase() + '.app.dev',
        default: letter === 'B',
        path: '**',
        target: 'http://localhost:' + servers[letter]
      });
    });
    server = dgate.server(options);
    server.listen(0, function () {
      port = server.address().port;
      done();
    });
  });
  it('request 2', function (done) {
    request('http://localhost:' + port + '/', function (err, resp, body) {
      assert.ifError(err);
      assert.equal(200, resp.statusCode);
      assert.equal(body, 'B,localhost');
      assert.equal(resp.headers['x-gate'], dgate.pkg.name + '/' + dgate.pkg.version);
      done();
    });
  });
  it('request 3', function (done) {
    request({uri: 'http://localhost:' + port + '/', headers: {'Host': 'a.app.dev'}}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(200, resp.statusCode);
      assert.equal(body, 'A,a.app.dev');
      done();
    });
  });
  it('request 4', function (done) {
    request({uri: 'http://localhost:' + port + '/', headers: {'Host': 'b.app.dev'}}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(200, resp.statusCode);
      assert.equal(body, 'B,b.app.dev');
      done();
    });
  });
  it('request 5', function (done) {
    request({uri: 'http://localhost:' + port + '/', headers: {'Host': 'c.app.dev'}}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(200, resp.statusCode);
      assert.equal(body, 'C,c.app.dev');
      server.close();
      done();
    });
  });
  it('server 3', function (done) {
    var options = {
      vhosts: []
    };
    Object.keys(servers).forEach(function (letter) {
      options.vhosts.push({
        host: letter.toLowerCase() + '.app.dev',
        sethost: 'app.dev',
        wildcard: letter === 'B',
        path: '**',
        target: 'http://localhost:' + servers[letter]
      });
    });
    server = dgate.server(options);
    server.listen(0, function () {
      port = server.address().port;
      done();
    });
  });
  it('request 6', function (done) {
    request({uri: 'http://localhost:' + port + '/', headers: {'Host': 'blah.c.app.dev'}}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(404, resp.statusCode);
      done();
    });
  });
  it('request 7', function (done) {
    request({uri: 'http://localhost:' + port + '/', headers: {'Host': 'blah.b.app.dev'}}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(200, resp.statusCode);
      assert.equal(body, 'B,app.dev');
      done();
    });
  });
  it('request 8', function (done) {
    request({uri: 'http://localhost:' + port + '/', headers: {'Host': 'foo.bar.b.app.dev'}}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(200, resp.statusCode);
      assert.equal(body, 'B,app.dev');
      done();
    });
  });
  it('request 9', function (done) {
    request({uri: 'http://localhost:' + port + '/', headers: {'Host': 'c.app.dev'}}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(200, resp.statusCode);
      assert.equal(body, 'C,app.dev');
      done();
    });
  });
  it('request 10', function (done) {
    request({uri: 'http://localhost:' + port + '/', headers: {'Host': 'app.dev'}}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(404, resp.statusCode);
      server.close();
      done();
    });
  });
  it('server 4', function (done) {
    var options = {
      vhosts: []
    };
    Object.keys(servers).forEach(function (letter) {
      if (letter === 'B') {
        options.vhosts.push({
          host: letter.toLowerCase() + '.app.dev',
          redirect: 'http://www.google.com/',
          path: '/google'
        });
        options.vhosts.push({
          host: letter.toLowerCase() + '.app.dev',
          redirect: 'http://www.yelp.com/?href=__href__',
          path: '/yelp'
        });
        options.vhosts.push({
          host: letter.toLowerCase() + '.app.dev',
          target: 'http://localhost:' + servers[letter],
          path: '**'
        });
      }
      else {
        options.vhosts.push({
          host: letter.toLowerCase() + '.app.dev',
          sethost: 'app.dev',
          default: letter === 'A',
          path: '**',
          target: 'http://localhost:' + servers[letter],
          options: {}
        });
      }
    });
    server = dgate.server(options);
    server.listen(0, function () {
      port = server.address().port;
      done();
    });
  });
  it('request 11', function (done) {
    request({uri: 'http://localhost:' + port + '/google', headers: {'Host': 'b.app.dev'}, followRedirect: false}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(301, resp.statusCode);
      assert.equal(resp.headers['location'], 'http://www.google.com/');
      done();
    });
  });
  it('request 12', function (done) {
    request({uri: 'http://localhost:' + port + '/yelp', headers: {'Host': 'b.app.dev'}, followRedirect: false}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(301, resp.statusCode);
      assert.equal(resp.headers['location'], 'http://www.yelp.com/?href=http%3A%2F%2Fb.app.dev%2Fyelp');
      done();
    });
  });
  it('request 13', function (done) {
    request({uri: 'http://localhost:' + port + '/blah', headers: {'Host': 'b.app.dev'}, followRedirect: false}, function (err, resp, body) {
      assert.ifError(err);
      assert.equal(200, resp.statusCode);
      assert.equal(body, 'B,b.app.dev');
      done();
    });
  });
});
