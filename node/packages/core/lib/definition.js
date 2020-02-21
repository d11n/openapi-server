(function main (parse_yaml, UTIL, ERROR) {
    return module.exports = class Definition {
        static async create (...args) {
            return await construct(this, ...args).catch(ERROR.throw)
        }
        static async validate (...args) {
            return await validate(...args).catch(ERROR.throw)
        }
    }

    ///////////

    async function construct (Class, definition, options = {}) {
        let valid_definition = await validate(definition).catch(ERROR.throw)
        valid_definition = await Class.validate(
            valid_definition,
            UTIL.get_options(options),
            // ^ Subclasses may need extra data/options in order to validate
        ).catch(ERROR.throw)
        const params = {}
        for (const key of Object.keys(valid_definition)) {
            if ('__' === key.substring(0, 2)) {
                params[ key.substring(2) ] = valid_definition[key]
                delete valid_definition[key]
            }
        }
        const instance = new Class(params)
        Object.assign(instance, valid_definition)
        return instance
    }

    async function validate (definition, options = {}) {
        return parse(definition)
    }

    ///////////

    function parse (definition) {
        let parsed_definition
        try {
            parsed_definition = 'string' === typeof definition
                ? parse_yaml(definition)
                : definition
        } catch (error) {
            return ERROR.throw(error)
        }
        if ('object' !== typeof parsed_definition) {
            return ERROR.throw(ERROR.DEFINITION_MUST_BE_OBJECT)
        }
        return parsed_definition
    }
}(
    require('js-yaml').safeLoad,
    require('./util'),
    require('./error'),
))
