# clientize
## Clientize reverse-proxy
Implements a Hapi-server based reverse-proxy that permits browser clients to make cross-domain requests to secured web-service APIs.

The package includes an AngularJS 1.3 dashboard client which can be used to examine the reverse-proxy configuration and create JSON ("app") configuration documents to configure the reverse proxy to support one or more upstream hosts.

## Environment variables
The main script `index.js` implements a full reverse-proxy and client dashboard application using the orchestrate.io cloud service as configuration storage. This implementation is configured with two sets of environment variables.
### Client API
This set of variables configures the dashboard app and client-facing API host
```
export CLIENTIZE_HOST=localhost											# Name of clientize proxy host (optional)
export CLIENTIZE_PORT=8000												# Host port (optional)
export CLIENTIZE_PROTOCOL=https											# Host http/https protocol (optional)
```
The example proxy will first look for `CLIENTIZE_HOST`, `CLIENTIZE_PORT`, and `CLIENTIZE_PROTOCOL` values. If they are not found, it will then look for `HOST`, `PORT`, and `PROTOCOL` values. It will use built in defaults if those are not found.
IMPORTANT NOTE: The environment variable `CLIENTIZE_PROTOCOL` is the protocol of the application server seen by a browser or other application, not the protocol of the reverse proxy server.  The reverse proxy server for the moment only is an HTTP server and it is assumed it sits behind another webserver which can be an HTTP or HTTPS server.
### Default pass-through proxy
This set of variables can be used to configure a basic pass-through reverse proxy
```
export CLIENTIZE_PROXY_KEY=[Client key]									# optional client-facing API key
export CLIENTIZE_PROXY_OIOKEY=[API key]									# upstream host API key
export CLIENTIZE_PROXY_HOST=api.orchestrate.io							# upstream host API
export CLIENTIZE_PROXY_PORT=8000										# optional upstream host port
export CLIENTIZE_PROXY_PROTOCOL=https									# upstream host API protocol
```
Assuming the proxy host is "proxy.com[:8000]" with the optional port, requests such as 
```
http://proxy.com[:8000]/api.orchestrate.io/clientize-passthrough/v0/$collection?query=$query&limit=$limit&offset=$offset"
```
will be passed through to
```
https://api.orchestrate.io/v0/$collection?query=$query&limit=$limit&offset=$offset"
```
Note the request to the upstream host is secure with `https://`, but the request to the proxy is not as `http://`.  The current version can be used behind a secured router such as Heroku provides to secure the client side API.

The minimal proxy configuration has a minimal dashboard appliction with login credential `clientizeit`. 

### Fully configurable proxy
Additional environment variables configure the proxy for use with an external application configuration store.  The current release uses Orchestrate.io as the configuration store to provide an example of how to use Orchestrate.io from the client via the reverse-proxy.
```
export CLIENTIZE_DB_OIOCOLLECTION=clientize								# Orchestrate.io collection for configuration storage
export CLIENTIZE_DB_CONFIG												# Name of reverse-proxy configuration doc in CLIENTIZE_DB_OIOCOLLECTION
export CLIENTIZE_DB_APP=clientize-demo									# Configuration app name in configuration storage
export CLIENTIZE_DB_OIOKEY=[Config API Key]								# API key for Orchestrate.io configuration collection
#
export CLIENTIZE_DASHBOARD_LOGIN=clientizeit							# Optional login credential for Dashboard App
export CLIENTIZE_DASHBOARD_KEY=[Dashboard API key]						# Dashboard client facing API reverse-proxy key
export CLIENTIZE_DASHBOARD_OIOKEY=$CLIENTIZE_DB_OIOKEY					# Dashboard client upstream Orchestrate.io API key
#
export CLIENTIZE_PROXY_KEY=[Client key]									# default optional client-facing API key
export CLIENTIZE_PROXY_OIOKEY=[API key]									# default upstream host API key
export CLIENTIZE_PROXY_HOST=api.orchestrate.io							# default upstream host API
export CLIENTIZE_PROXY_PORT=8000										# default optional upstream host port
export CLIENTIZE_PROXY_PROTOCOL=https									# upstream host API protocol
```
The `CLIENTIZE_DB_*` variables specify the Clientize configuration storage for server-side access by the reverse-proxy server.

The `CLIENTIZE_DASHBOARD_*` variables configure the Clientize reverse-proxy for client-side access by the dashboard application.

As with the minimal configuration, the `CLIENTIZE_PROXY_*` variables specify the default reverse-proxy.  This configuration will be over-ridden by the configuration information specified by the `CLIENTIZE_DB_APP`.

## Reverse-Proxy Configuration Apps
The fully-configurable reverse-proxy is configured with an application JSON document. Multiple documents can be stored in the configuration store. Future revisions will support other JSON configuration document schemes.

A configuration document includes one or more configuration apps (set of options) and has the following items:
```
{
    apps: [
        {
            "app": "// application name specified for CLIENTIZE_DB_APP",
            "key": "// reverse-proxy client API key for CLIENTIZE_PROXY_KEY",
            "routes": [
                {
                    "method": "// upstream server endpoint HTTP methods ('GET' or ['GET', 'POST', ...] or *)",
                    "path": "// client facing endpoint formed as '/prefix/upstream-path'",
                    "protocol": "// 'http' or 'https'",
                    "host": "// upstream server name",
                    "port": "//upstream server port expressed as a number not a string",
                    "username": "// upstream server Basic mode auth credential, e.g. CLIENTIZE_PROXY_OIOKEY",
                    "password": "// upstream server Basic mode auth credential, typically blank",
                    "bearer": "// upstream server Bearer mode credential, (not yet implemented)",
                    "strip": "// Boolean 'true' to strip prefix from URL, 'false' to strip prefix from URL",
                    "prefix": "// prefix for client facing path '/prefix/upstream-path'"
               }
            ]
        },
            ...
        {
            "app": "// another application name specified for CLIENTIZE_DB_APP",
        }
    ]
}
```
Currently only the `username` and `password` authentication credentials for Basic-mode authentication are supported in `routes` objects.  For the Orchestrate.io API, the `username` is the orchestrate API key. A future revision will support the `bearer` item for upstream APIs that require Bearer-mode authentication.

The `routes` object is an arbitrary-length array that includes any desired number of proxied routes.  The values for the `method`, `path`, `protocol`, `host` and `port` items conform to those for the corresponding items in the Hapi v.8.1 "Route configuration object":
```
http://hapijs.com/api#route-configuration
```

The `prefix` value is a standard HTTP path specifier of the form `/path/to/more` that will be stripped off the head end of the `path` value in client-requests before the request is passed to the upstream server when the `strip` is set to `true`. The developer can use route `prefix` parameters to differentiate proxied routes as needed. This is particular useful when supporting multiple upstream hosts.

See the "Configuration App JSON-Schema" below for the JSON-Schema the Dashboard application uses to validate an configuration app document before it is saved in the configuration store.

## Dashboard Application
### Launching
When the reverse-proxy is running, pointing at the `/` route of the reverse-proxy host brings up the dashboard client application, e.g.
```
http://proxy.com[:8000]
```
To protect upstream API key information the dashboard requires a single login credential supplied as the `CLIENTIZE_DASHBOARD_LOGIN` variable.  If this variable is not supplied the default login is `clientizeit`.  In the basic demo server the built-in browser login dialog is used, with the credential supplied as `username` with no `password`.
### "Options" page
This page provides a read-only display of the current reverse-proxy configuration as a JSON string object that has four member objects:

The `connection` section specifies the client-facing `hostname` and `port`.

The `proxy` section is the current reverse-proxy JSON configuration app document.

The `dashboard` section is a separate JSON configuration app document that specifies the reverse-proxy the dashboard client uses to access the configuration store.

The `db` section specifies the upstream configuration information the reverse-proxy uses server-side to access the configuration storage.

### "Apps" page
This page is a simple editor for review the JSON app documents in the configuration storage.

This page has two views, a read-only view that is a JSON array of all of the app documents and an editor view that allows the user to modify or add documents as JSON text.

The editor page includes features to validate edited app documents before they are uploaded to the configuration store and to generate random API keys as needed.

If the proxy is configured as the minimal default pass-through proxy, the "Apps" page only provides the read-only view of the default app document.

## Additional Info
### Configuration App JSON-Schema
```
{
    title: 'apps schema',
    type: 'object',
    properties: {
        apps: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    app: { type: 'string' },
                    key: { type: 'string' },
                    routes: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                method: {
                                    oneOf: [
                                        {
                                            type: 'string',
                                            enum: [ '*', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS' ]
                                        },
                                        {
                                            type: 'array',
                                            items: {
                                                type: 'string',
                                                enum: [ 'GET','POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS' ]                                        
                                            },
                                            additionalItems: false
                                        }
                                    ]
                                },
                                path: {
                                    pattern: '^((\/[^\/]+)+)$',
                                    type: 'string'
                                },
                                protocol: {
                                    type: 'string',
                                    enum: [
                                        'http',
                                        'https'
                                    ]
                                },
                                host: {
                                    type: 'string',
                                    format: 'hostname'
                                },
                                port: {
                                    type: [ 'number', 'null' ]
                                },
                                username: {
                                    type: [ 'string' , 'null' ]
                                },
                                password: {
                                    type: [ 'string' , 'null' ]
                                },
                                bearer: {
                                    type: [ 'string' , 'null' ]
                                },
                                strip: {
                                    type: [ 'boolean', 'null' ]
                                },
                                prefix: {
                                    pattern: '^((\/[^\/]+)+)$',
                                    type: [ 'string', 'null' ]
                                }
                            },
                            additionalProperties: false,
                            required: [ 'method', 'path', 'protocol', 'host' ],

                            oneOf: [
                                {
                                    anyOf: [
                                        { type: 'object', required: [ 'username' ] },
                                        { type: 'object', required: [ 'password' ] }
                                    ]
                                },
                                {
                                    type: 'object',
                                    required: [ 'bearer' ]
                                }
                            ]

                        },
                        additionalItems: false,
                    }
                },
                additionalProperties: false,
                required: [ 'app', 'routes' ],
            },
            additionalItems: false,
        }
    },
    additionalProperties: false,
    required: ['apps']
};
```

## Notes:
### AngularJS and Promises
The digest mechanism in AngularJS can interact with ES6 promises pakages in unpredictable ways. The AngularJS 1.3 `$q` promise is designed specifically to work properly with the AngularJS digest mechanism.

Before v1.4.0, the `orchestrate`/`clientize-orchestrate` client was based on `kew` promises.  It appeared to work properly with Firefox and Google Chrome, but was erratic on Safari.
With v1.4.0, the `clientize-orchestrate` client was modified to use ECMAScript 6 promises and to use an ECMAScript 5 ES6 style promise library of the developer's choice.

## Planned changes
### Testing
1. Develop in-brower client and server side unit tests.
2. Add end-to-end tests.

### Reverse-proxy server
1. Add https support.
2. Support additional storage options for proxy app configuration documents.

### AngularJS dashboard client
1. Modify the dashboard client to support other dashboard login methods but avoid cookie-based session authorization.
2. (Done v.0.2.0) Support minimization/uglification by adding the standard AngularJS parameter naming info to the `angular.module` declarations.

### Orchestrate/clientize-orchestrate clients
1. Combine the orchestrate/clientize-orchestrate packages into a single package that works client and server side.
2. Rewrite the combined package using ECMAScript 6 promises.
3. (Done v.0.2.0) Redesign to allow use of any EMCAScript 6 promise library including AngularJS `$q`.

### Support for alternatives to AngularJS client (e.g. Backbone.js, Ember.js)
1. Rewrite the base functions to use XHR support directly rather than `$http`.
2. Modify the controller functions to use a local context that gets mapped to AngularJS `$scope`.

