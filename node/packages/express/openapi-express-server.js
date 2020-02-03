(function main (express, Openapi_Express_Doc, UTIL) {
    const { does_path_exist, join_paths, ERROR } = UTIL
    return module.exports = class Openapi_Express_Server {
        #dir = null
        #app = null
        #loaded = false
        constructor (raw_params) {
            const params = construct(raw_params)
            this.#dir = params.dir
            this.#app = params.app
            this.doc = params.doc
            return this
            //return create_express_app_proxy(this, this.#app)
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
    }

    ///////////

    function construct (raw_params) {
        const params = {
            dir: join_paths(raw_params.dir, 'operations'),
        }
        if (does_path_exist(params.dir)) {
            params.doc = new Openapi_Express_Doc(raw_params.doc)
            params.app = express()
        } else {
            return ERROR.throw_error(
                ERROR.EXPRESS_NO_OPERATIONS_DIR(raw_params.dir),
            )
        }
        return params
    }

    function create_express_app_proxy(target_instance, app) {
        return new Proxy(target_instance, {
            get: function get_express_proxy_member(target, prop, receiver) {
                switch (true) {
                    case 'load' === prop:
                        return server.load
                }
        
                ///////////
        
                function get_target_value() {
                    return Reflect.get(target, prop, receiver)
                }
        
                function get_app_value() {
                    return Reflect.get(app, prop, receiver)
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
        does_path_exist: require('fs').existsSync,
        join_paths: require('path').join,
        ...require('@openapi-server/core'),
    },
))
