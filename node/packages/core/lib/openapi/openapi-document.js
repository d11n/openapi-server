(function main (Document, Openapi_Definition, ERROR) {
    return module.exports = class Openapi_Document extends Document {
        static get Definition () {
            return Openapi_Definition
        }
    }
}(
    require('../document'),
    require('./openapi-definition'),
    require('../error'),
))
