(function main (test, Openapi_Definition, good_definition) {
    test('validate openapi 3 definitions', validate_definitions)

    /////////// Tests

    async function validate_definitions (t) {
        let definition

        const bad_definition = {
            ...JSON.parse(JSON.stringify(good_definition)),
            nonsense: true,
        }
        t.pass()

        definition = await Openapi_Definition.create(good_definition)
        t.true(definition instanceof Openapi_Definition)
        t.true(definition.info.version === good_definition.info.version)
        definition = await Openapi_Definition.create(
            JSON.stringify(good_definition),
        )
        t.true(definition instanceof Openapi_Definition)
        t.true(definition.info.version === good_definition.info.version)
        
        definition = await Openapi_Definition.validate(good_definition)
        t.false(definition instanceof Openapi_Definition)
        t.true(definition.info.version === good_definition.info.version)
        
        await t.throwsAsync(async () => {
            return await Openapi_Definition.validate(
                JSON.stringify(good_definition),
            )
        })
        await t.throwsAsync(async () => {
            return await Openapi_Definition.create(bad_definition)
        })
        await t.throwsAsync(async () => {
            return await Openapi_Definition.validate(bad_definition)
        })
    }
}(
    require('ava'),
    require('./openapi-definition'),
    require('../../fixtures/openapi/v3/minimum-v1.json'),
))
