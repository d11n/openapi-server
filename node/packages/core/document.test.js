(function main (test, join_paths, SERVER, Document, Definition, doc1, doc2) {
    test('load from object', load_from_object)
    test('load from file', load_from_file)
    test('load from url', load_from_url)
    test('ensure load/reload', ensure_load_reload)
    test('fail on bad args', fail_on_bad_args)

    /////////// Tests

    async function load_from_object (t) {
        let definition
        try {
            definition = await Document.load(Definition, doc1)
            t.true(definition.info.version === doc1.info.version)
            definition = await Document.load(Definition, doc2)
            t.true(definition.info.version === doc2.info.version)

            const doc = new Document(doc1)
            await doc.load()
            t.true(doc.definition.info.version === doc1.info.version)
            await doc.load(doc2)
            t.true(doc.definition.info.version === doc2.info.version)
        } catch (error) {
            t.fail(error.message)
        }
    }

    async function load_from_file (t) {
        let definition
        try {
            const doc_dir = join_paths(__dirname, 'fixtures/openapi/v3')
            const doc1_path = join_paths(doc_dir, 'minimum-v1.json')
            const doc2_path = join_paths(doc_dir, 'minimum-v2.json')

            definition = await Document.load(Definition, doc1_path)
            t.true(definition.info.version === doc1.info.version)
            definition = await Document.load(Definition, doc2_path)
            t.true(definition.info.version === doc2.info.version)

            const doc = new Document(doc1_path)
            await doc.load()
            t.true(doc.definition.info.version === doc1.info.version)
            await doc.load(doc2_path)
            t.true(doc.definition.info.version === doc2.info.version)
        } catch (error) {
            t.fail(error.message)
        }
    }

    async function load_from_url (t) {
        let definition, server1, server2
        try {
            server1 = SERVER.create(
                (req, res) => res.end(JSON.stringify(doc1)),
            )
            server2 = SERVER.create(
                (req, res) => res.end(JSON.stringify(doc2)),
            )
            const server1_url = await SERVER.check(server1)
            const server2_url = await SERVER.check(server2)

            definition = await Document.load(Definition, server1_url)
            t.true(definition.info.version === doc1.info.version)
            definition = await Document.load(Definition, server2_url)
            t.true(definition.info.version === doc2.info.version)

            const doc = new Document(server1_url)
            await doc.load()
            t.true(doc.definition.info.version === doc1.info.version)
            await doc.load(server2_url)
            t.true(doc.definition.info.version === doc2.info.version)
        } catch (error) {
            t.fail(error.message)
        } finally {
            server1.close && server1.close()
            server2.close && server2.close()
        }
    }

    async function ensure_load_reload (t) {
        try {
            const doc = new Document
            await t.throwsAsync(async () => doc.load())
            await t.throwsAsync(async () => doc.reload())
            await doc.load(doc1)
            t.true(doc.definition.info.version === doc1.info.version)
            await doc.load()
            t.true(doc.definition.info.version === doc1.info.version)
            await doc.reload()
            t.true(doc.definition.info.version === doc1.info.version)
        } catch (error) {
            t.fail(error.message)
        }
    }

    async function fail_on_bad_args (t) {
        await t.throwsAsync(async () => Document.load(null))
        await t.throwsAsync(async () => Document.load(Document, {}))
        await t.throwsAsync(async () => Document.load(Definition, 'deadend'))
        await t.throwsAsync(async () => Document.load(Definition, {}, 3))
        try {
            new Document(() => 'blow up')
        } catch (error) {
            t.pass()
        }
        await t.throwsAsync(async () => Document.load(Definition, 1))
        try {
            new Document(true)
        } catch (error) {
            t.pass()
        }

        const zombie_path = join_paths(__dirname, 'fixtures', 'zombie.json')
        await t.throwsAsync(async () => Document.load(Definition, zombie_path))

        const server = SERVER.create((req, res) => {
            res.writeHead(500, { 'Content-Type': 'text/plain' })
            return res.end()
        })
        const server_url = await SERVER.check(server)
        await t.throwsAsync(async () => Document.load(Definition, server_url))
        server.close()
    }
}(
    require('ava'),
    require('path').join,
    {
        create: require('http').createServer,
        check: require('test-listen'),
    },
    require('./document'),
    require('./definition'),
    require('./fixtures/openapi/v3/minimum-v1.json'),
    require('./fixtures/openapi/v3/minimum-v2.json'),
))
