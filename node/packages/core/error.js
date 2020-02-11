(function main (sprintf) {
    return module.exports = {
        get_error,
        get_type_error,
        throw_error,
        throw_type_error,
        TYPE_OF_ERROR_MSG: [
            '%s must have a type of %s.',
        ],
        INSTANCE_OF_ERROR_MSG: [
            '%s must be an instance of %s.',
        ],
        SUBCLASS_OF_ERROR_MSG: [
            '%s must either be %s or a subclass of it.',
        ],
        ABSTRACT_STATIC_MEMBER_MSG: [
            '%s.%s() is an abstract static member',
            'and must be defined in a child class.',
        ],
        ABSTRACT_INSTANCE_MEMBER_MSG: [
            '%s#%s() is an abstract instance member',
            'and must be defined in a child class.',
        ],
        DEFINITION_MUST_BE_OBJECT: [
            'Definition must be an object',
            'or a JSON/YAML string that parses into an object',
        ],
        DEFINITION_INSTANCE_TYPE_MSG: [
            'params.instance must be an instance of %s',
        ],
        DOCUMENT_BAD_SOURCE_MSG: [
            'Document argument must be a filesystem path, URL, or object.',
        ],
        DOCUMENT_NO_SOURCE_MSG: [
            'Without a doc source, there\'s nothing to do.',
            'Provide a filesystem path, URL, or object at instantiation',
            'or when calling a method.',
        ],
        JSON_SCHEMA_NO_VERSION_MSG: [
            'JSON Schema version is required',
            'and must be either defined in the $schema prop',
            'or passed in as a parameter.',
        ],
        JSON_SCHEMA_VERSION_MISMATCH_MSG: [
            'The JSON Schema version defined in the $schema prop (%s)',
            'does not match the version passed in as a parameter (%s)',
        ],
        JSON_SCHEMA_VERSION_TOO_EDGE_MSG: [
            'Version "%s" is not yet supported.',
        ],
        JSON_SCHEMA_INVALID_VERSION_MSG: [
            '"%s" is not a valid JSON Schema version.',
        ],
        JSON_SCHEMA_VALIDATION_MSG: [
            '`$%s` %s.',
        ],
        OPENAPI_NO_OPERATION_ID_MSG: [
            '%s".%s must have an operationId.',
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
