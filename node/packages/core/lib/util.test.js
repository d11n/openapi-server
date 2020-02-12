(function main (test, UTIL) {
    test('gets options', get_options)
    test('verifies inheritance', verify_inheritance)

    /////////// Tests

    function get_options (t) {
        t.deepEqual(UTIL.get_options({}), {})
        t.deepEqual(UTIL.get_options({ version: 3 }), { version: 3 })
        t.deepEqual(UTIL.get_options('invalid'), {})
    }

    function verify_inheritance (t) {
        t.true(UTIL.is_inheritor(TypeError, Error))
        t.true(UTIL.is_inheritor(Error, Error))
        t.true(UTIL.is_not_inheritor(Error, TypeError))
        t.throws(() => UTIL.is_inheritor(null, Error))
        t.throws(() => UTIL.is_inheritor(Error, null))
    }
}(
    require('ava'),
    require('./util'),
))
