(function main (express, Openapi_Express_Document, UTIL) {
    const { check_path_exists, join_paths, ERROR } = UTIL
    const KEY = Symbol('the key to access the constructor')

    return module.exports = class Openapi_Express_Server {
        #document = null
        #operations_directory = null
        #app = null
        #loaded = false
        get document () {
            return this.#document
        }
        get route_list () {
            return get_express_route_list(this.#app)
        }
        constructor ({ key, document, operations_directory, app }) {
            if (KEY !== key) {
                ERROR.throw_error(ERROR.NO_NEW_MSG, 'Openapi_Express_Server')
            }
            this.#document = document
            this.#operations_directory = operations_directory
            this.#app = app
            return create_express_app_proxy(this, this.#app)
        }
        static async create (...args) {
            return await construct(...args)
        }
        static async load (...args) {
            return await load(...args)
        }
        async load () {
            if (this.#loaded) {
                return this
            }
            this.#loaded = true
            await load({
                document: this.#document,
                operations_directory: this.#operations_directory,
                app: this.#app,
            })
            return this
        }
        // On app.listen(), make sure the OpenAPI routes are loaded:
        async listen () {
            return await this.load()
        }
    }

    ///////////

    async function construct ({ directory, document }) {
        const operations_directory = join_paths(directory, 'operations')
        if (check_path_exists(operations_directory)) {
            return new module.exports({
                key: KEY,
                document: new Openapi_Express_Document(document),
                operations_directory: operations_directory,
                app: express(),
            })
        }
        return ERROR.throw_error(
            ERROR.EXPRESS_NO_OPERATIONS_DIR_MSG,
            operations_directory,
        )
    }

    async function load ({ document, operations_directory, app }) {
        const op_prop_list = [
            'get',
            'put',
            'post',
            'delete',
            'options',
            'head',
            'patch',
            'trace',
        ]
        await document.load()
        const path_dict = document.definition.paths
        for (const path_key of Object.keys(path_dict)) {
            const express_path = path_key.replace(/\{\s*(\S+)\s*\}/g, ':$1')
            const path_item = path_dict[path_key]
            for (const op_prop of op_prop_list) {
                const op = path_item[op_prop]
                if (op) {
                    const op_func = require(
                        join_paths(operations_directory, op.operationId),
                    )
                    // TODO: ensure parameters
                    app[op_prop](express_path, op_func)
                }
            }
        }
        return get_express_route_list(app)
    }

    ///////////

    function get_express_route_list(app) {
        const route_list = []
        try {
            for (const { route } of app._router.stack) {
                if (route && route.path) {
                    route_list.push(route)
                }
            }
        } catch (error) {
            // do nothing
        }
        return route_list
    }

    ///////////

    function create_express_app_proxy(server, app) {
        return new Proxy(server, {
            get: function get_express_proxy_member(target, prop, proxy) {
                const server_value = get_prop_value(target)
                const app_value = get_prop_value(app)
                const server_prop_is_method = 'function' === typeof server_value
                const app_prop_is_method = 'function' === typeof app_value
                switch (true) {
                    case undefined === server_value && undefined === app_value:
                        return undefined
                    case undefined !== server_value && !server_prop_is_method:
                    case server_prop_is_method && !app_prop_is_method:
                    // ^ Ignore express app props that are not methods when
                    //   target prop is defined, this shouldn't happen
                        return server_value
                    case undefined !== app_value && !app_prop_is_method:
                    case app_prop_is_method && !server_prop_is_method:
                        return app_value
                    case server_prop_is_method && app_prop_is_method:
                        return function (...args) {
                            const promise = server_value(...args)
                            // ^ Defining an express method on the server
                            //   is effectively a pre-hook
                            return promise && 'function' === typeof promise.then
                                ? promise
                                    .then(() => app_value(...args))
                                    .catch(ERROR.throw_error)
                                : app_value(...args)
                        }
                }
                return ERROR.throw_error(
                    'This line of get_express_proxy_member() should not have',
                    'executed. Please log an issue at',
                    'https://github.com/d11n/openapi-server/issues',
                    'with steps for how this error was triggered',
                )

                ///////////

                // prop is from outer closure
                function get_prop_value (owner) {
                    if (undefined === owner[prop]) {
                        return undefined
                    }
                    const value = owner[prop]
                    return 'function' === typeof value
                        ? function (...args) { value.apply(owner, args) }
                        // ^ Ensure that `this` is the "owner" instance, so the
                        //   server can access its private properties and the
                        //   express app will behave as if nothing interesting
                        //   is wrapping it
                        : value
                }
            },
        })
    }
}(
    require('express'),
    require('./openapi-express-document'),
    {
        check_path_exists: require('fs').existsSync,
        join_paths: require('path').join,
        ...require('@openapi-server/core'),
    },
))
