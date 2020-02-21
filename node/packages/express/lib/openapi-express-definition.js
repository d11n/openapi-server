(async function main ({ Openapi_Definition, ERROR }) {
    return module.exports = class Openapi_Express_Definition extends Openapi_Definition {
        static async validate (...args) {
            return await validate(...args).catch(ERROR.throw)
        }
    }

    ///////////

    async function validate (definition, options = {}) {
        const valid_definition = await Openapi_Definition.validate(
            definition,
            options,
        ).catch(ERROR.throw)
        validate_paths(valid_definition.paths)
        return valid_definition
    }

    function validate_paths (path_dict) {
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
        for (const path_key of Object.keys(path_dict)) {
            const path_item = path_dict[path_key]
            for (const prop of op_prop_list) {
                const op = path_item[prop]
                if (op && !op.operationId) {
                    return ERROR.throw(
                        ERROR.MISSING_OPERATION_ID_MSG,
                        path_key,
                        prop,
                    )
                }
            }
        }
    }
}(
    require('@openapi-server/core'),
))
