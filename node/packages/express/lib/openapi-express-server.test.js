(function main (test, join_paths, Openapi_Express_Server) {
    test.cb('openapi express server starts', start_server)

    /////////// Tests

    function start_server (t) {
        const directory = join_paths(__dirname, '../fixtures')
        const server_params = {
            directory: directory,
            document: join_paths(directory, 'openapi.json'),
        }
        Openapi_Express_Server.create(server_params)
            .then(boot_app)
            .catch((error) => throw_error(error))

        ///////////

        async function boot_app (app, ...args) {
            try {
                return await app.listen(examine_running_app)
            } catch (error) {
                return throw_error(error)
            }
        }

        function examine_running_app (...args) {
            // TODO: actually examine the app
            t.pass()
            t.end()
        }
    }

    function throw_error (error) {
        throw error
    }
}(
    require('ava'),
    require('path').join,
    require('./openapi-express-server'),
))
