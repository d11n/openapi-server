(function main (Swagger_Parser, Definition, UTIL, ERROR) {
    return module.exports = class Openapi_Definition extends Definition {
        static async validate (...args) {
            return await validate(...args).catch(ERROR.throw)
        }
    }

    ///////////

    async function validate (raw_definition, raw_options = {}) {
        const options = UTIL.get_options(raw_options)
        // ^ if options isn't passed, parser.validate() throws:
        //       Cannot read property 'dereference' of undefined
        const parser = new Swagger_Parser
        // ^ instantiate because Swagger_Parser.validate() throws:
        //       Class is not a constructor
        const definition = await parser.dereference(raw_definition, options)
            .catch(ERROR.throw)
        return await parser.validate(definition, options)
            .catch(ERROR.throw)
    }
}(
    require('swagger-parser'),
    require('../definition'),
    require('../util'),
    require('../error'),
))
