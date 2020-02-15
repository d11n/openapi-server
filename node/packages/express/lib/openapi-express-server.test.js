(function main (test, join_paths, Openapi_Express_Server, definition) {
    test('openapi express server starts', start_server)

    /////////// Tests

    async function start_server (t) {
        const directory = join_paths(__dirname, '../test')
        const app = await Openapi_Express_Server.create({
            directory: directory,
            //document: join_paths(directory, 'openapi.json'),
            document: definition,
        })
        await app.listen(examine_running_app)

        ///////////

        function examine_running_app (...args) {
            t.pass()
        }
    }
}(
    require('ava'),
    require('path').join,
    require('./openapi-express-server'),
    require('../test/openapi.json'),
))
