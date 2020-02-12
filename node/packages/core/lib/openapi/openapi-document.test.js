(function main (test, Openapi_Document, definition) {
    test('loads openapi 3 document', load_document)

    /////////// Tests

    async function load_document (t, version) {
        const doc = await Openapi_Document.create(definition)
        await doc.load()
        t.pass()
    }
}(
    require('ava'),
    require('./openapi-document'),
    require('../../fixtures/openapi/v3/minimum-v2.json'),
))
