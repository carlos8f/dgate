var dgate = require('../');

module.exports = function (options) {
  var server = dgate.server(options);
  var listening = false;

  function getOptions (msg) {
    var parts = msg.split(':');
    if (parts[0] === 'options') {
      options = JSON.parse(parts.slice(1).join(':'));
      if (!listening) {
        server.listen(options.port);
        listening = true;
      }
    }
  }
  process.on('message', getOptions);
  process.send('options');
  return server;
};
