(function main (express, Openapi_Express_Doc, UTIL) {
    const { check_path_exists, join_paths, ERROR } = UTIL
    return module.exports = class Openapi_Express_Server {
        #dir = null
        #app = null
        #loaded = false
        constructor (raw_params) {
            const params = construct(raw_params)
            this.#dir = params.dir
            this.#app = params.app
            this.doc = params.doc
            return create_express_app_proxy(this, this.#app)
        }
        static async load (...args) {
            return await load(...args)
        }
        async load () {
            try {
                if (this.#loaded) {
                    return get_express_route_list(this.#app)
                }
                this.#loaded = true
                return await load({
                    dir: this.#dir,
                    app: this.#app,
                    doc: this.doc,
                })
            } catch (error) {
                return ERROR.throw_error(error)
            }
        }
        // On app.listen(), make sure the OpenAPI routes are loaded:
        async listen() {
            return await this.load()
        }
    }

    ///////////

    function construct (raw_params) {
        const params = {
            dir: join_paths(raw_params.dir, 'operations'),
        }
        if (check_path_exists(params.dir)) {
            params.doc = new Openapi_Express_Doc(raw_params.doc)
            params.app = express()
        } else {
            return ERROR.throw_error(
                ERROR.EXPRESS_NO_OPERATIONS_DIR(raw_params.dir),
            )
        }
        return params
    }

    function create_express_app_proxy(server, app) {
        return new Proxy(server, {
            get: function get_express_proxy_member(target, prop, proxy) {
                const target_value = get_prop_value(target)
                const app_value = get_prop_value(app)
                const target_prop_is_method = 'function' === typeof target_value
                const app_prop_is_method = 'function' === typeof app_value
                switch (true) {
                    case undefined === target_value && undefined === app_value:
                        return undefined
                    case undefined !== target_value && !target_prop_is_method:
                    case target_prop_is_method && !app_prop_is_method:
                    // ^ Ignore express app props that are not methods when
                    //   target prop is defined, this shouldn't happen
                        return target_value
                    case undefined !== app_value && !app_prop_is_method:
                    case app_prop_is_method && !target_prop_is_method:
                        return app_value
                    case target_prop_is_method && app_prop_is_method:
                        return function (...args) {
                            target_value(...args)
                            // ^ Defining an express method on the target
                            //   is effectively a pre-hook
                            return app_value(...args)
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
                        // ^ Ensure that `this` is the correct object, so the
                        //   server can access its private properties and the
                        //   express app will behave as if nothing interesting
                        //   is wrapping it
                        : value
                }
            },
        })
    }

    ///////////

    async function load ({ dir, app, doc }) {
        try {
            await doc.load()
            await doc.validate()
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
            const path_dict = doc.paths
            for (const path_key of Object.keys(path_dict)) {
                const express_path = path_key.replace(/\{\s*(\S+)\s*\}/g, ':$1')
                const path_item = path_dict[path_key]
                for (const op_prop of op_prop_list) {
                    const op = path_item[op_prop]
                    if (op) {
                        const op_func = require(join_paths(dir, op.operationId))
                        // TODO: ensure parameters
                        app[op_prop](express_path, op_func)
                    }
                }
            }
            return get_express_route_list(app)
        } catch (error) {
            return ERROR.throw_error(error)
        }
    }

    function get_express_route_list(app) {
        const route_list = []
        for (const { route } of app._router.stack) {
            route
                && route.path
                && route_list.push(route)
        }
        return route_list
    }
}(
    require('express'),
    require('./openapi-express-doc'),
    {
        check_path_exists: require('fs').existsSync,
        join_paths: require('path').join,
        ...require('@openapi-server/core'),
    },
))
