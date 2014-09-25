var minimatch = require('minimatch')
  , parseUrl = require('url').parse

module.exports = function (vhosts, req) {
  for (var idx = 0; idx < vhosts.length; idx++) {
    var v = vhosts[idx];
    if (minimatch(req.headers['host'] || '', v.host) && minimatch(parseUrl(req.url).pathname, v.path)) {
      return v;
    }
  }
};
