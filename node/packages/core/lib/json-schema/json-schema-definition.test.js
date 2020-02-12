(function main (test, Json_Schema_Definition, DOC) {
    test('validate draft-07 schemas', validate_schemas, 'v7')
    test('validate draft-06 schemas', validate_schemas, 'v6')
    test('validate draft-04 schemas', validate_schemas, 'v4')
    test('validate data against draft-07 schemas', validate_data, 'v7')
    test('validate data against draft-06 schemas', validate_data, 'v6')
    test('validate data against draft-04 schemas', validate_data, 'v4')

    /////////// Tests

    async function validate_schemas (t, version) {
        let definition

        const schema = JSON.parse(JSON.stringify(DOC[version].city))
        const { $schema } = schema
        delete schema.$schema

        definition = await Json_Schema_Definition.create({
            $schema: $schema,
            ...schema,
        })
        t.pass()
        definition = await Json_Schema_Definition.create(
            schema,
            { version: version },
        )
        t.pass()
        definition = await Json_Schema_Definition.create(
            {
                $schema: $schema,
                ...schema,
            },
            { version: version },
        )
        t.pass()

        await t.throwsAsync(async () => {
            return await Json_Schema_Definition.create(schema)
        })
        await t.throwsAsync(async () => {
            return await Json_Schema_Definition.create(schema, { version: 5 })
        })
        await t.throwsAsync(async () => {
            return await Json_Schema_Definition.create(
                schema,
                { version: '2019-09' },
            )
        })
        await t.throwsAsync(async () => {
            return await Json_Schema_Definition.create(
                {
                    $schema: $schema,
                    ...schema,
                },
                { version: 'v7' === version ? 6 : 7 },
            )
        })
        await t.throwsAsync(async () => {
            return await Json_Schema_Definition.create({
                $schema: $schema,
                ...schema,
                type: 'nonsense',
            })
        })
        await t.throwsAsync(async () => {
            return await Json_Schema_Definition.create(false)
        })
        await t.throwsAsync(async () => {
            return await Json_Schema_Definition.create(
                '{ "z": function (om) { return /bie/ } }',
            )
        })
        await t.throwsAsync(async () => {
            return await Json_Schema_Definition.validate('nonsense')
        })
    }

    async function validate_data (t, version) {
        let definition
        const schema = DOC[version].city
        const good_data = {
            city: 'Paris',
            country: 'France',
            country_code: 'FR',
        }
        const bad_data = {
            city: 'Paris',
            country: 'France',
            country_code: 'FRA',
        }

        definition = await Json_Schema_Definition.create(schema)
        await definition.validate(good_data)
        t.pass()
        await t.throwsAsync(async () => {
            return await definition.validate(bad_data)
        })
    }
}(
    require('ava'),
    require('./json-schema-definition'),
    {
        v7: {
            city: require('../../fixtures/json-schema/draft-07/city.json'),
        },
        v6: {
            city: require('../../fixtures/json-schema/draft-06/city.json'),
        },
        v4: {
            city: require('../../fixtures/json-schema/draft-04/city.json'),
        },
    },
))
