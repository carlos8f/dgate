module.exports = function (str, req) {
  return str
    .replace('__path__', req.href.path)
    .replace('__pathname__', req.href.pathname)
    .replace('__hostname__', req.href.hostname)
    .replace('__host__', req.href.host)
    .replace('__proto__', req.href.protocol.replace(':', ''))
    .replace('__referer__', encodeURIComponent(req.href.href))
    .replace('__auth__', req.href.auth)
    .replace('__search__', req.href.search)
    .replace('__query__', req.href.query)
    .replace('__hash__', req.href.hash);
};
