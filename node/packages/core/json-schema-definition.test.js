(function main (test, Json_Schema_Definition, DOC) {
    test('validate draft-07 schemas', validate_schemas, 'v7')
    test('validate draft-06 schemas', validate_schemas, 'v6')
    test('validate draft-04 schemas', validate_schemas, 'v4')
    test('validate data against draft-07 schemas', validate_data, 'v7')
    test('validate data against draft-06 schemas', validate_data, 'v6')
    test('validate data against draft-04 schemas', validate_data, 'v4')

    /////////// Tests

    function validate_schemas (t, version) {
        const schema = JSON.parse(JSON.stringify(DOC[version].city))
        const { $schema } = schema
        delete schema.$schema

        debugger
        new Json_Schema_Definition({
            $schema: $schema,
            ...schema,
        })
        t.pass()
        debugger
        new Json_Schema_Definition(
            schema,
            { version: version },
        )
        t.pass()
        new Json_Schema_Definition(
            {
                $schema: $schema,
                ...schema,
            },
            { version: version },
        )
        t.pass()

        t.throws(() => new Json_Schema_Definition(schema))
        t.throws(() => new Json_Schema_Definition(schema, { version: 5 }))
        t.throws(() => new Json_Schema_Definition(
            schema,
            { version: '2019-09' },
        ))
        t.throws(() => new Json_Schema_Definition(
            {
                $schema: $schema,
                ...schema,
            },
            { version: 'v7' === version ? 6 : 7 },
        ))
        t.throws(() => new Json_Schema_Definition({
            $schema: $schema,
            ...schema,
            type: 'nonsense',
        }))
        t.throws(() => new Json_Schema_Definition(false))
        t.throws(() => new Json_Schema_Definition(
            '{ "z": function (om) { return /bie/ } }',
        ))
        t.throws(() => Json_Schema_Definition.validate(
            Error,
            'nonsense',
        ))
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

        definition = new Json_Schema_Definition(schema)
        definition.validate(good_data)
        t.pass()
        t.throws(() => definition.validate(bad_data))
    }
}(
    require('ava'),
    require('./json-schema-definition'),
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
