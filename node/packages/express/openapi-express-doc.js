(async function main ({ Openapi_Doc, ERROR }) {
    return module.exports = class Openapi_Express_Doc extends Openapi_Doc {
        static async validate (...args) {
            return await validate(...args)
        }
        async validate (...args) {
            try {
                super.validate(...args)
                validate_paths(this.paths)
                return this
            } catch (error) {
                return ERROR.throw_error(error)
            }
        }
    }

    ///////////

    async function validate (raw_doc) {
        try {
            const doc = await Openapi_Doc.validate(raw_doc)
            validate_paths(this.paths)
            return doc
        } catch (error) {
            return ERROR.throw_error(error)
        }
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
                    return ERROR.throw_error(
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
