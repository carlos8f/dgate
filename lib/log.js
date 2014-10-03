var moment = require('moment');

module.exports = function (options) {
  return {
    message: function () {
      if (!options.verbose) return;
      var args = [].slice.call(arguments).map(function (arg) {
        return arg.constructor === Object ? JSON.stringify(arg) : arg;
      }).join(' ');
      console.log(moment().format() + ' [message]', args);
    },
    request: function () {
      if (!options.verbose) return;
      var args = [].slice.call(arguments).map(function (arg) {
        return arg.constructor === Object ? JSON.stringify(arg) : arg;
      }).join(' ');
      console.log(moment().format() + ' [request]', args);
    },
    error: function () {
      if (!options.verbose) return;
      var args = [].slice.call(arguments).map(function (arg) {
        return arg.constructor === Object ? JSON.stringify(arg) : arg;
      }).join(' ');
      console.error(moment().format() + ' [error]', args);
    }
  };
};
