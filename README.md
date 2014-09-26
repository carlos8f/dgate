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
# route traffic from my.dev to 127.0.0.1:3000
#dgate port=3000
127.0.0.1    my.dev

# route traffic from *.myother.dev to 127.0.0.1:3001
#dgate port=3001&wildcard=true
127.0.0.1    myother.dev

# route traffic from *.blah.dev to terraeclipse.com
#dgate target=terraeclipse.com&wildcard=true
127.0.0.1    blah.dev

# make this the default vhost, with a canonical url (also force https)
#dgate port=3002&default=true&canonical=s8f.org&https=true
127.0.0.1    s8f.org www.s8f.org
```

Start the server:

```
$ sudo dgate --verbose --port 80
```

On POSIX you can drop privileges:

```
$ sudo dgate --verbose --port 80 --setuid nobody --setgid nogroup
```

Cheers :]
