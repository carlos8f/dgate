var qs = require('querystring');

module.exports = function (data) {
  var vhosts = [];
  var matches = data.match(/(^|\n\r?)#dgate\s*(.*)\n\r?(.*)\n\r?/g);
  if (matches) {
    matches.forEach(function (m) {
      m = m.trim().split(/\r?\n/);
      m[0] = m[0].split(/\s+/);
      var options = (m[0][1]) ? qs.parse(m[0][1]) : {};
      m[1] = m[1].split(/\s+/);
      var target = options.target || m[1][0];
      if (!~target.indexOf('http')) target = 'http://' + target;
      if (options.port) target += ':' + options.port;
      options.target = target;
      m[1].slice(1).forEach(function (host) {
        var v = {host: host};
        Object.keys(options).forEach(function (k) {
          v[k] = options[k];
        });
        vhosts.push(v);
      });
    });
  }
  return vhosts;
};
