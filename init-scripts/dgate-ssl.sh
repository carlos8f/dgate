#!/bin/bash
#
# chkconfig: - 85 15
# description: Domain Gateway SSL
# processname: dgate
# config: /etc/hosts
# pidfile: /var/run/dgate-ssl.pid

# MANUAL CONFIGURATION NEEDED:
CERT=/path/to/server.pem
KEY=/path/to/server.key
PORT=443
USER=nobody
GROUP=nobody

# id of the daemon
BASENAME=dgate-ssl

# Source function library.
if [ -f /etc/init.d/functions ]; then
  . /etc/init.d/functions
elif [ -f /etc/rc.d/init.d/functions ] ; then
  . /etc/rc.d/init.d/functions
else
  exit 0
fi

# Source networking configuration.
. /etc/sysconfig/network

# Check that networking is up.
[ ${NETWORKING} = "no" ] && exit 0

ulimit -n 16384
RETVAL=0

start() {
  echo -n $"Starting ${BASENAME}: "
  daemon --check ${BASENAME} nohup /usr/local/bin/dgate --port ${PORT} --setuid ${USER} --setgid ${GROUP} --sslCert ${CERT} --sslKey ${KEY} >> /var/log/${BASENAME}.log 2>&1 &
  RETVAL=$?
  if [ $RETVAL -eq 0 ]; then
    echo
  else
    echo -n $"config error"
    failure $"checking $BASENAME config file $CFG_FILE"
  fi
  [ $RETVAL -eq 0 ] && touch /var/lock/subsys/${BASENAME}
  return $RETVAL
}

stop() {
  echo -n $"Shutting down ${BASENAME}: "
  killproc $BASENAME
  RETVAL=$?
  echo
  [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/${BASENAME}
  return $RETVAL
}

restart() {
  stop
  start
}

svcstatus() {
  status $BASENAME
}

condrestart() {
  [ -e /var/lock/subsys/${BASENAME} ] && restart || :
}

# See how we were called.
case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    restart
    ;;
  reload)
    restart
    ;;
  condrestart)
    condrestart
    ;;
  status)
    svcstatus
    ;;
  *)
    echo $"Usage: $BASENAME {start|stop|restart|reload|condrestart|status}"
    RETVAL=1
esac
 
exit $RETVAL
