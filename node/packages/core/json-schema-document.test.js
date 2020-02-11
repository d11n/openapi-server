(function main (test, Json_Schema_Document, SCHEMA) {
    test('load draft-07 schemas', load_schemas, 'v7')
    test('load draft-06 schemas', load_schemas, 'v6')
    test('load draft-04 schemas', load_schemas, 'v4')

    /////////// Tests

    async function load_schemas (t, version) {
        let doc
        try {
            doc = new Json_Schema_Document(
                SCHEMA[version].city,
                { version: version },
            )
            await doc.load()
            t.pass()
        } catch (error) {
            t.fail(error.message)
        }
    }
}(
    require('ava'),
    require('./json-schema-document'),
    {
        v7: {
            city: require('./fixtures/json-schema/draft-07/city.json'),
        },
        v6: {
            city: require('./fixtures/json-schema/draft-06/city.json'),
        },
        v4: {
            city: require('./fixtures/json-schema/draft-04/city.json'),
        },
    },
))
