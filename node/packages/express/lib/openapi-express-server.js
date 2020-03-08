(function main (express, CORE, Openapi_Express_Document, UTIL) {
    const { Json_Schema_Definition, ERROR } = CORE
    const { check_path_exists, join_paths, module_name } = UTIL
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
                ERROR.throw(ERROR.NO_NEW_MSG, 'Openapi_Express_Server')
            }
            this.#document = document
            this.#operations_directory = operations_directory
            this.#app = app
            return create_express_app_proxy(this, this.#app)
        }
        static async create (...args) {
            return await construct(...args).catch(ERROR.throw)
        }
        static async load (...args) {
            return await load(...args).catch(ERROR.throw)
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
            }).catch(ERROR.throw)
            return this
        }
        // On app.listen(), make sure the OpenAPI routes are loaded:
        async listen () {
            await this.load().catch(ERROR.throw)
            return this
        }
    }

    ///////////

    async function construct ({ directory, document }) {
        const operations_directory = join_paths(directory, 'operations')
        if (check_path_exists(operations_directory)) {
            const doc = await Openapi_Express_Document
                .create(document)
                .catch(ERROR.throw)
            const app = express()
            app.use(express.json())
            return new module.exports({
                key: KEY,
                document: doc,
                operations_directory: operations_directory,
                app: app,
            })
        }
        return ERROR.throw(
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
        await document.load().catch(ERROR.throw)
        const path_dict = document.definition.paths
        // TODO: do this async'ly
        for (const path_key of Object.keys(path_dict)) {
            const express_path = path_key.replace(/\{\s*(\S+)\s*\}/g, ':$1')
            const path_item = path_dict[path_key]
            for (const op_prop of op_prop_list) {
                const op_def = path_item[op_prop]
                if (op_def) {
                    const op = require(
                        join_paths(operations_directory, op_def.operationId),
                    )
                    const wrapped_op = await wrap_op(op_def, op).catch(ERROR.throw)
                    app[op_prop](express_path, wrapped_op)
                }
            }
        }
        return get_express_route_list(app)
    }

    async function wrap_op (def, op) {
        const req_schema_dict = await build_req_schema_dict(def).catch(ERROR.throw)
        const res_schema_dict = await build_res_schema_dict(def).catch(ERROR.throw)
        return function perform_op (request, response, next) {
            if (req_schema_dict) {
                const media_type = get_media_type(request)
                const req_schema = req_schema_dict[media_type]
                if (req_schema) {
                    try {
                        req_schema.validate(request.body)
                    } catch (error) {
                        response
                            .status(400)
                            .send(`Request does not conform to the ${ media_type } schema`)
                            // ^ TODO: Make validation 400 message translatable
                        return next(error)
                    }
                }

            }
            const response_proxy = new Proxy(response, {
                get: get_get_trap,
            })
            return op(request, response_proxy, next)
        }

        ///////////

        function get_get_trap (target, prop) {
            if (res_schema_dict && [ 'json', 'send' ].includes(prop)) { 
                return (function process_response (body) {
                    const response = this
                    const code = response.statusCode
                    if (code >= 400) {
                        return target[prop](body)
                    }
                    if ('json' === prop || 'object' === typeof body) {
                        const media_type = get_media_type(response)
                        const media_type_dict = res_schema_dict[code]
                            || res_schema_dict.default
                        const schema = media_type_dict[media_type]
                        if (schema) {
                            return schema.validate(body)
                                .then(() => {
                                    return target[prop](body)
                                })
                                .catch((error) => {
                                    // TODO: Throw/log/something when response validation fails
                                    console.error(error)
                                    return response.status(500).end()
                                })
                        }
                    }
                    return target[prop](body)
                }).bind(target)
            // TODO: Trap other response methods
            } else if (prop in target) {
                return target[prop]
            }
            return undefined
        }
    }

    async function build_req_schema_dict (def) {
        const schema_dict = {}
        if (!def.requestBody) {
            return null
        }
        const media_type_dict = def.requestBody.content
        const media_type_list = Object.keys(media_type_dict)
            .filter((media_type) => media_type_dict[media_type].schema)
        if (0 === media_type_list.length) {
            return null
        }
        await Promise.all(
            media_type_list.map(set_schema_dict),
        ).catch(ERROR.throw)
        return schema_dict

        ///////////

        async function set_schema_dict (media_type) {
            const { schema } = media_type_dict[media_type]
            if (schema) {
                const schema_validator = await Json_Schema_Definition.create(
                    schema,
                    { version: 7, formats: get_formats() },
                    // ^ TODO: Don't hard-code JSON Schema version
                ).catch(ERROR.throw)
                schema_dict[media_type] = schema_validator
            }
        }
    }

    async function build_res_schema_dict (def) {
        const schema_dict = {}
        const response_dict = def.responses
        const schema_dict_key_list = []
        for (const code of Object.keys(response_dict)) {
            const response = response_dict[code]
            if (!response.content) {
                return null
            }
            for (const media_type of Object.keys(response.content)) {
                const { schema } = response.content[media_type]
                if (schema) {
                    schema_dict_key_list.push(`${ code }~${ media_type }`)
                }
            }
        }
        if (0 === schema_dict_key_list.length) {
            return null
        }
        await Promise.all(
            schema_dict_key_list.map(set_schema_dict),
        ).catch(ERROR.throw)
        return schema_dict

        ///////////

        async function set_schema_dict (schema_dict_key) {
            const [ code, media_type ] = schema_dict_key.split('~', 2)
            const { schema } = response_dict[code].content[media_type]
            if (schema) {
                const schema_validator = await Json_Schema_Definition.create(
                    schema,
                    { version: 7, formats: get_formats() },
                    // ^ TODO: Don't hard-code JSON Schema version
                ).catch(ERROR.throw)
                schema_dict[code] = schema_dict[code] || {}
                schema_dict[code][media_type] = schema_validator
            }
        }
    }

    ///////////

    function get_media_type (reqres) {
        const media_type = reqres.get('Content-Type') || 'application/json'
        return media_type.trim().split(/\s*;\s*/)[0]
    }

    function get_express_route_list (app) {
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

    function compare (a, b) {
        return a < b
            ? -1
            : a > b
                ? 1
                : 0
    }

    function get_formats () {
        return {
            int32: {
                type: 'integer',
                validate: (value) => {
                    const boundary = Math.pow(2, 31)
                    return Number.isInteger(value)
                        && value >= -1 * boundary
                        && value < boundary
                },
                compare: compare,
                async: false,
            },
            int64: {
                type: 'integer',
                validate: (value) => {
                    const boundary = Math.pow(2, 63)
                    return Number.isInteger(value)
                        && value >= -1 * boundary
                        && value < boundary
                },
                compare: compare,
                async: false,
            },
            float: {
                type: 'number',
                validate: (value) => {
                    const boundary = Math.pow(2, 31)
                    return value >= -1 * boundary
                        && value < boundary
                },
                compare: compare,
                async: false,
            },
            double: {
                type: 'number',
                validate: (value) => {
                    const boundary = Math.pow(2, 63)
                    return value >= -1 * boundary
                        && value < boundary
                },
                compare: compare,
                async: false,
            },
            byte: {
                type: 'string',
                validate: (value) => 'string' === typeof value,
                compare: compare,
                async: false,
            },
            binary: {
                type: 'string',
                validate: (value) => 'string' === typeof value,
                compare: compare,
                async: false,
            },
            password: {
                type: 'string',
                validate: (value) => 'string' === typeof value,
                compare: compare,
                async: false,
            },
        }
    }

    ///////////

    // TODO: Clean up the server Proxy
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
                            const server_return = server_value(...args)
                            // ^ Defining an express method on the server
                            //   is effectively a pre-hook
                            if (server_return && 'function' === typeof server_return.then) {
                                return server_return
                                    .then(() => {
                                        const app_return = app_value(...args)
                                        return app_return && 'function' === typeof app_return.then
                                            ? app_return.catch((error) => {
                                                return ERROR.throw(error)
                                            })
                                            : Promise.resolve(app_return)
                                    }).catch((error) => {
                                        return ERROR.throw(error)
                                    })
                            }
                            const app_return = app_value(...args)
                            return app_return && 'function' === typeof app_return.then
                                ? app_return.catch((error) => {
                                    return ERROR.throw(error)
                                })
                                : app_return
                        }
                }
                return ERROR.throw(
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
                        ? function (...args) { return value.apply(owner, args) }
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
    require('@openapi-server/core'),
    require('./openapi-express-document'),
    {
        check_path_exists: require('fs').existsSync,
        join_paths: require('path').join,
        module_name: require('../package.json').name,
    },
))
