(function main (test, Openapi_Document, good_doc) {
    test('validate docs against openapi spec', validate_docs)

    /////////// Tests

    async function validate_docs (t) {
        const bad_doc = {
            ...good_doc,
            nonsense: true,
        }
        let definition
        try {
            definition = await Openapi_Document.validate(good_doc)
            t.true(definition.info.version === good_doc.info.version)
            definition = await Openapi_Document.validate(
                JSON.stringify(good_doc),
            )
            t.true(definition.info.version === good_doc.info.version)

            const doc = new Openapi_Document(good_doc)
            await doc.load()
            await doc.validate()
            t.true(doc.definition.info.version === good_doc.info.version)
        } catch (error) {
            t.fail(error.message)
        }
        await t.throwsAsync(async () => Openapi_Document.validate(bad_doc))
        const doc = new Openapi_Document(bad_doc)
        try {
            await doc.load()
        } catch (error) {
            t.fail(error.message)
        }
        await t.throwsAsync(async () => doc.validate())
    }
}(
    require('ava'),
    require('./openapi-document'),
    require('./fixtures/openapi/v3/minimum-v1.json'),
))
