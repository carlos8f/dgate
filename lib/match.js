var minimatch = require('minimatch');

module.exports = function (vhosts, req) {
  var dfault;
  for (var idx = 0; idx < vhosts.length; idx++) {
    var v = vhosts[idx];
    if (v.options.default && !dfault) dfault = v;
    if (minimatch(req.href.hostname, v.host) && minimatch(req.href.pathname, v.path)) {
      return v;
    }
  }
  return dfault;
};
