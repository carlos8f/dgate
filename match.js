var minimatch = require('minimatch')
  , url = require('url')

module.exports = function (vhosts, req) {
  var href = 'http' + (req.connection.encrypted ? 's' : '') + '://' + (req.headers['host'] || 'localhost') + req.url;
  var parsedUrl = url.parse(href);
  for (var idx = 0; idx < vhosts.length; idx++) {
    var v = vhosts[idx];
    if (minimatch(parsedUrl.hostname, v.host) && minimatch(parsedUrl.pathname, v.path)) {
      return v;
    }
  }
};
