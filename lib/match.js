var minimatch = require('minimatch');

module.exports = function (vhosts, req) {
  var dfault;
  for (var idx = 0; idx < vhosts.length; idx++) {
    var v = vhosts[idx];
    if (v.default && !dfault) dfault = v;
    if ((!v.host || minimatch(req.href.hostname, v.host)) && (!v.path || minimatch(req.href.pathname, v.path))) {
      return v;
    }
  }
  return dfault;
};
