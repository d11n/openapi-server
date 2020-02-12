(function main (Swagger_Parser, Definition, UTIL, ERROR) {
    return module.exports = class Openapi_Definition extends Definition {
        static async validate (...args) {
            return await validate(...args)
        }
    }

    ///////////

    async function validate (definition, options = {}) {
        const parser = new Swagger_Parser
        // ^ instantiate because Swagger_Parser.validate() throws:
        //       Class is not a constructor
        const valid_definition = await parser.validate(
            definition,
            UTIL.get_options(options),
        )
        // ^ if options isn't passed, parser.validate() throws:
        //       Cannot read property 'dereference' of undefined
        return valid_definition
    }
}(
    require('swagger-parser'),
    require('../definition'),
    require('../util'),
    require('../error'),
))
