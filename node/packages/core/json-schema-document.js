(function main (Document, Json_Schema_Definition, ERROR) {
    return module.exports = class Json_Schema_Document extends Document {
        static get Definition () {
            return Json_Schema_Definition
        }
    }
}(
    require('./document'),
    require('./json-schema-definition'),
    require('./error'),
))
