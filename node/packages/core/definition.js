(function main (parse_yaml, ERROR) {
    return module.exports = class Definition {
        constructor (definition, options = {}) {
            Object.assign(this, this.constructor.validate(
                this,
                parse(definition),
                options,
            ))
            return this
        }
        static validate (instance, definition, options = {}) {
            // Subclasses define validation rules
            return definition
        }
    }

    ///////////

    function parse (definition) {
        let parsed_definition
        try {
            parsed_definition = 'string' === typeof definition
                ? parse_yaml(definition)
                : definition
        } catch (error) {
            return ERROR.throw_error(error)
        }
        if ('object' !== typeof parsed_definition) {
            return ERROR.throw_error(ERROR.DEFINITION_MUST_BE_OBJECT)
        }
        return parsed_definition
    }
}(
    require('js-yaml').safeLoad,
    require('./error'),
))
