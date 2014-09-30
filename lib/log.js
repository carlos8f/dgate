module.exports = function (options) {
  return {
    message: function () {
      var args = [].slice.call(arguments).map(function (arg) {
        return JSON.stringify(arg);
      }).join(' ');
      console.log(new Date() + ' [message]', args);
    },
    request: function () {
      var args = [].slice.call(arguments).map(function (arg) {
        return JSON.stringify(arg);
      }).join(' ');
      console.log(new Date() + ' [request]', args);
    },
    error: function () {
      var args = [].slice.call(arguments).map(function (arg) {
        return JSON.stringify(arg);
      }).join(' ');
      console.error(new Date() + ' [error]', args);
    }
  };
};
