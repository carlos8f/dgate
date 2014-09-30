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
      if (!~target.indexOf('http')) target = 'http' + (options.https ? 's' : '') + '://' + target;
      if (options.port) target += ':' + options.port;
      m[1].slice(1).forEach(function (host) {
        if (options.wildcard) host = '{' + host + ',*.' + host + '}';
        options.host = host;
        options.target = target;
        vhosts.push(options);
      });
    });
  }
  return vhosts;
};
