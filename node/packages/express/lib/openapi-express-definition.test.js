(function main (test, Openapi_Express_Definition, good_definition) {
    test('validates openapi 3 definitions for express', validate_definitions)

    /////////// Tests

    async function validate_definitions (t) {
        let definition

        definition = await Openapi_Express_Definition.create(good_definition)
        t.true(definition instanceof Openapi_Express_Definition)
        t.true(definition.paths['/'].get.operationId === 'getRoot')

        definition = await Openapi_Express_Definition.validate(good_definition)
        t.false(definition instanceof Openapi_Express_Definition)
        t.true(definition.info.version === good_definition.info.version)

        const bad_definition = JSON.parse(JSON.stringify(good_definition))
        delete bad_definition.paths['/'].get.operationId

        await t.throwsAsync(async () => {
            return await Openapi_Express_Definition.create(bad_definition)
        })
    }
}(
    require('ava'),
    require('./openapi-express-definition'),
    require('../fixtures/openapi.json'),
))
