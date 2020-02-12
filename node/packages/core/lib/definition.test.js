(function main (test, Definition) {
    test('instantiates parseable objects', instantiate)
    test('composes validation and inheritance', compose)

    /////////// Tests

    async function instantiate (t) {
        let definition

        definition = await Definition.create({ foo: 'bar' }) // POJSO
        t.true(definition instanceof Definition)
        t.deepEqual(definition.foo, 'bar')

        definition = await Definition.create('{ "foo": "bar" }') // JSON
        t.true(definition instanceof Definition)
        t.deepEqual(definition.foo, 'bar')

        definition = await Definition.create('foo: bar', { v: 3 }) // YAML
        t.true(definition instanceof Definition)
        t.deepEqual(definition.foo, 'bar')
        t.notDeepEqual(definition.v, 3)

        definition = await Definition.create({}, null)
        t.true(definition instanceof Definition)
        t.deepEqual(Object.keys(definition).length, 0)

        await t.throwsAsync(async () => {
            return await Definition.create()
        })
        await t.throwsAsync(async () => {
            return await Definition.create('foo:bar') // string not YAML
        })
        await t.throwsAsync(async () => {
            return await Definition.create('@\n`') // evil YAML
        })
    }

    async function compose (t) {
        let definition

        definition = await Definition.validate('foo: bar')
        t.deepEqual(definition.foo, 'bar')

        const Sub_Definition = class Sub_Definition extends Definition {
            constructor (params) {
                super()
                this.foo = params.foo
            }
            static async validate (definition) {
                return {
                    ...definition,
                    __foo: 'bar',
                }
            }
        }
        definition = await Sub_Definition.create({ foz: 'baz' })
        t.deepEqual(definition.foo, 'bar')
        t.deepEqual(definition.foz, 'baz')
    }
}(
    require('ava'),
    require('./definition'),
))
