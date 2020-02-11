(function main (test, Definition) {
    test('accepts parseable objects', accepts_parseable_objects)

    /////////// Tests

    function accepts_parseable_objects (t) {
        new Definition({ foo: 'bar' }) // normal object
        t.pass()
        new Definition('{ "foo": "bar" }') // JSON string
        t.pass()
        new Definition('foo: bar') // YAML string
        t.pass()

        t.throws(() => new Definition)
        t.throws(() => new Definition('foo:bar')) // plain ole string
        t.throws(() => new Definition('@\n`')) // evil YAML

        Definition.validate(null, 'foo: bar')
        t.pass()
    }
}(
    require('ava'),
    require('./definition'),
))
