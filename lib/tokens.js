module.exports = function (str, req) {
  Object.keys(req.href).forEach(function (k) {
    str = str.replace('__' + k + '__', encodeURIComponent(req.href[k]));
    str = str.replace('_' + k + '_', req.href[k]);
  });
  return str;
};
