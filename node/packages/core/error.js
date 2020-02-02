(function main () {
    return module.exports = {
        get_error,
        get_type_error,
        throw_error,
        throw_type_error,
        BAD_OPENAPI_DOC_ARG_MSG: format_message(
            'OpenAPI document argument must be a',
            'filesystem path, URL, or object.',
        ),
        MISSING_OPERATION_ID_MSG: (path_key, prop) => format_message(
            `"${ path_key }".${ prop } must have an operationId.`
        ),
        NO_OPENAPI_DOC_SOURCE_ERROR: format_message(
            'Without a source for the OpenAPI doc, there\'s nothing to do.',
            'Provide a filesystem path, URL, or object at instantiation',
            'or when calling a method.',
        ),
        EXPRESS_NO_OPERATIONS_DIR: (provided_dir) => format_message(
            `There is no \`operations\` directory in ${ provided_dir }.`,
        ),
    }

    ///////////

    function get_error (...raw_message) {
        if (raw_message[0] instanceof Error) {
            return raw_message[0]
        }
        return new Error(format_message(...raw_message))
    }

    function get_type_error (...raw_message) {
        if (raw_message[0] instanceof TypeError) {
            return raw_message[0]
        } else if (raw_message[0] instanceof Error) {
            return new TypeError(raw_message[0].message)
        }
        return new TypeError(format_message(...raw_message))
    }

    function throw_error (...raw_message) {
        throw get_error(...raw_message)
    }

    function throw_type_error (...raw_message) {
        throw get_type_error(...raw_message)
    }

    function format_message (...args) {
        if (1 === args.length) {
            const message = args[0]
            return Array.isArray(message)
                ? message.map(String).join(' ')
                : String(message)
        }
        return args.map(String).join(' ')
    }
}())
