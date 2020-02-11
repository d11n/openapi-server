(function main (parse_yaml, Swagger_Parser, Document, ERROR) {
    return module.exports = class Openapi_Document extends Document {
        static async validate (...args) {
            try {
                return await validate(...args)
            } catch (error) {
                return ERROR.throw_error(error)
            }
        }
        async validate () {
            try {
                this.definition = await validate(this.definition)
                return this
            } catch (error) {
                return ERROR.throw_error(error)
            }
        }
    }

    ///////////

    async function validate (raw_doc) {
        try {
            const doc = 'string' === typeof raw_doc
                ? parse_yaml(raw_doc)
                : raw_doc
            const parser = new Swagger_Parser
            // ^ instantiate because Swagger_Parser.validate() throws:
            //       Class is not a constructor
            const valid_doc = await parser.validate(doc, {})
            // ^ if options isn't passed, validate() throws:
            //       Cannot read property 'dereference' of undefined
            return valid_doc
        } catch (error) {
            return ERROR.throw_error(error)
        }
    }
}(
    require('js-yaml').safeLoad,
    require('swagger-parser'),
    require('./document'),
    require('./error'),
))
