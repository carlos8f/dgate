# dgate

Domain gateway, a simple clustered HTTP virtual host router

## Install

```
$ npm install -g dgate
```

## Setup

Put a `#dgate` comment above one or more lines in your `/etc/hosts` file. Options are specified
with form urlencoding:

```
# this routes traffic from my.dev to 127.0.0.1:3000
#dgate port=3000
127.0.0.1    my.dev

# this routes traffic from *.myother.dev to 127.0.0.1:3001
#dgate port=3001&wildcard=true
127.0.0.1    myother.dev
```

Start the server:

```
$ sudo dgate --verbose --port 80
```

Cheers :]
