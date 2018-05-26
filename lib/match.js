var minimatch = require('minimatch');

module.exports = function (vhosts, req) {
  var dfault;
  for (var idx = 0; idx < vhosts.length; idx++) {
    var v = vhosts[idx];
    if (v.default && !dfault) dfault = v;
    var hostPattern = v.wildcard ? '{' + v.host + ',*.' + v.host + '}' : v.host;
    if ((!v.host || (req.href.hostname && minimatch(req.href.hostname, hostPattern))) && (!v.path || (req.href.pathname && minimatch(req.href.pathname, v.path)))) {
      return v;
    }
  }
  return dfault;
};
