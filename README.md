# dgate

Domain gateway, a simple clustered HTTP virtual host router

## Purpose

`dgate` is a Node.js-based HTTP gateway. It can proxy or redirect incoming requests to any host or port,
based on a flexible set of rules, defined as comments in your `/etc/hosts` file. `dgate` makes use
of [cluster](http://nodejs.org/api/cluster.html) forking for better performance on a multi-core machine,
and privilege separation for better security.

Features:

- serve an arbitrary number of web apps on a single port
- virtual host matching on domain, subdomain, wildcard, or path
- develop several apps locally, each accessible on port 80, and use domains like `test.dev`
- enforce canonical domains, SSL, or redirect certain domains/paths to arbitrary locations
- central logging for all requests
- use all your CPUs with flexible worker pool
- simple hot-reloadable configuration via `/etc/hosts`

## Install

```
$ [sudo] npm install -g dgate
```

## Start the server

```
$ sudo dgate --verbose --port 80
```

On POSIX you can drop privileges for tighter security:

```
$ sudo dgate --verbose --port 80 --setuid nobody --setgid nogroup
```

### Ubuntu upstart script

If you'd rather run it as a proper service on boot, and you're on Ubuntu,
you can write this to `/etc/init/dgate.conf`:

```
# dgate.conf
description "domain gateway"
start on started networking
stop on runlevel [016]
limit nofile 1000000 1000000
console log
script
  dgate --port 80 --setuid nobody --setgid nogroup --verbose
end script
respawn
```

Then `sudo service dgate start` to run the server.

## Configuration

`dgate` works by reading the domain -> IP mappings in your `/etc/hosts` file and turning them into virtual hosts.
Additionally you **MUST** provide a `#dgate` comment above each line you wish to enable as a virtual host:

```
#dgate option1=value1&option2=value2
<ip1>     <hostname1> [hostname2...]

#dgate option1=value1&option2=value2
<ip2>     <hostname3> [hostname4...]
```

### /etc/hosts Example

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

# redirect requests from mytemp.com to myreal.com/$path
#dgate redirect=myreal.com__path
127.0.0.1    mytemp.com
```

### Order of operations

1. If a match is found, the one first defined is served
2. else if defined, the default is served
3. else a 404 response is generated.

To disable a rule, just add a space between `#` and `dgate`.

### Virtual host options

Values must be properly urlencoded, i.e. in JavaScript `encodeURIComponent(value)`

- `port=number` (**required** unless using `target` or `redirect`) - the TCP port of the target to proxy to, appended to the IP from the `/etc/hosts` rule.
- `target=host[:port]` (**required** unless using `port` or `redirect`) - the target host, and optional port to proxy to, i.e. `example.com:80` (supports token replacement, see below)
- `redirect=url` (**required** unless using `port` or `target`) - redirect all requests to the specified url. (supports token replacement, see below)
- `path=glob` - match the virtual host only if the incoming path matches the glob. i.e. `/some/**/path`
- `canonical=host` - redirect requests to this hostname if the request's `Host` header doesn't match it. i.e. `www.example.com`
- `wildcard=true` - also accept requests to subdomains of the matched hostname.
- `default=true` - treat the virtual host as "default", falling back to it if no other matches are found.
- `https=true` - force HTTPS by redirecting requests to `https://` version of URLs.
- `sethost=host` - artificially set the `Host` header when forwarding requests to the proxy target. i.e. `specific.host.example.com`

### Token replacement

Some options such as `redirect` can contain placeholders to be filled in by request variables:

```
#dgate redirect=http%3A%2F%2Fwww.example.com%2F%3Fhref%3D__href_u
127.0.0.1     mydomain.com
```

This will redirect requests from mydomain.com to `http://www.example.com/?href=(urlencoded version of the originally requested absolute URL)`

#### Auto URL encoding

- For the raw token value, use `__[name]` (leading double underscore).
- For the urlencoded token value, use `__[name]_u`
- For the double-urlencoded token value, use `__[name]_uu`

#### Supported tokens

- `__protocol` The incoming protocol string, i.e. `https:`
- `__auth` The incoming basic auth string, i.e. `my:pass`
- `__host` The incoming host:port string, i.e. `example.com:3000`
- `__port` The requested port, i.e. `3000`
- `__hostname` The requested domain name, i.e. `example.com`
- `__search` The requested query string including `?`, i.e. `?blah=1&foo=bar`
- `__query` The requested query string, excluding `?` i.e. `blah=1&foo=bar`
- `__pathname` The requested path, excluding query string, i.e. `/some/path`
- `__path` The requested path, including query string, i.e. `/some/path?blah=1&foo=bar`
- `__href` The requested absolute URL, i.e. `http://my:pass@localhost:3000/some/path?blah=1&foo=bar`
- `__ip` The remote IP address, i.e. `127.0.0.1`

## TODO

- path rewriting, i.e. proxy `http://test.dev/myapp/*` to `http://127.0.0.1:3000/*`
- option for redirect status code, 302 or 301
- custom error pages
- custom or auto robots.txt or favicon
- custom or auto health check
- redundant targets + load balancing strategy
