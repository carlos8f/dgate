module.exports = function (str, req) {
  Object.keys(req.href).forEach(function (k) {
    str = str.replace('__' + k + '_uu', encodeURIComponent(encodeURIComponent(req.href[k])));
    str = str.replace('__' + k + '_u', encodeURIComponent(req.href[k]));
    str = str.replace('__' + k, req.href[k]);
  });
  str = str.replace('__ip_uu', encodeURIComponent(encodeURIComponent(req.ip)));
  str = str.replace('__ip_u', encodeURIComponent(req.ip));
  str = str.replace('__ip', req.ip);
  return str;
};
