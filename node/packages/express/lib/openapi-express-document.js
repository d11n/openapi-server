(function main ({ Openapi_Document }, Openapi_Express_Definition) {
    return module.exports = class Openapi_Express_Document extends Openapi_Document {
        static get Definition () {
            return Openapi_Express_Definition
        }
    }
}(
    require('@openapi-server/core'),
    require('./openapi-express-definition'),
))
