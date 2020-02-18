(function main (test, Openapi_Express_Document, definition) {
    test('loads openapi 3 document for express', load_document)

    /////////// Tests

    async function load_document (t, version) {
        const doc = await Openapi_Express_Document.create(definition)
        await doc.load()
        t.pass()
    }
}(
    require('ava'),
    require('./openapi-express-document'),
    require('../fixtures/openapi.json'),
))
