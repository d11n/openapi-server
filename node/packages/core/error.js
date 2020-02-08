(function main (sprintf) {
    return module.exports = {
        get_error,
        get_type_error,
        throw_error,
        throw_type_error,
        BAD_DOC_ARG_MSG: [
            'OpenAPI document argument must be a',
            'filesystem path, URL, or object.',
        ],
        MISSING_OPERATION_ID_MSG: [
            '%s".%s must have an operationId.',
        ],
        NO_DOC_SOURCE_ERROR_MSG: [
            'Without a source for the OpenAPI doc, there\'s nothing to do.',
            'Provide a filesystem path, URL, or object at instantiation',
            'or when calling a method.',
        ],
        EXPRESS_NO_OPERATIONS_DIR_MSG: [
            'There is no `operations` directory in %s.',
        ],
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

    function format_message (raw_format, ...args) {
        const format = Array.isArray(raw_format)
            ? raw_format.map(String).join(' ')
            : String(raw_format)
        return sprintf(format, ...args)
    }
}(
    require('sprintf'),
))
