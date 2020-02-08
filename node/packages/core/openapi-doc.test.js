(function main (test, join_paths, SERVER, Openapi_Doc, doc1, doc2) {
    test('load openapi doc from object', load_doc_from_object)
    test('load openapi doc from file', load_doc_from_file)
    test('load openapi doc from url', load_doc_from_url)
    test('fail on nonsense doc arg', fail_doc_from_nonsense)

    test('load only once unless reload()', load_reload)

    test('validate docs against openapi spec', validate_docs)

    /////////// Tests

    async function load_doc_from_object (t) {
        let doc
        try {
            doc = await Openapi_Doc.load(doc1)
            t.true(doc.info.version === doc1.info.version)
            doc = await Openapi_Doc.load(doc2)
            t.true(doc.info.version === doc2.info.version)
        } catch (error) {
            t.fail(error.message)
        }
        try {
            doc = new Openapi_Doc(doc1)
            await doc.load()
            t.true(doc.info.version === doc1.info.version)
            await doc.load(doc2)
            t.true(doc.info.version === doc2.info.version)
        } catch (error) {
            t.fail(error.message)
        }
    }

    async function load_doc_from_file (t) {
        const doc1_path = join_paths(__dirname, 'fixtures', 'doc1.json')
        const doc2_path = join_paths(__dirname, 'fixtures', 'doc2.json')
        let doc
        try {
            doc = await Openapi_Doc.load(doc1_path)
            t.true(doc.info.version === doc1.info.version)
            doc = await Openapi_Doc.load(doc2_path)
            t.true(doc.info.version === doc2.info.version)
        } catch (error) {
            t.fail(error.message)
        }
        try {
            doc = new Openapi_Doc(doc1_path)
            await doc.load()
            t.true(doc.info.version === doc1.info.version)
            await doc.load(doc2_path)
            t.true(doc.info.version === doc2.info.version)
        } catch (error) {
            t.fail(error.message)
        }
    }

    async function load_doc_from_url (t) {
        const server1 = SERVER.create(
            (req, res) => res.end(JSON.stringify(doc1)),
        )
        const server2 = SERVER.create(
            (req, res) => res.end(JSON.stringify(doc2)),
        )
        const server1_url = await SERVER.get_url(server1)
        const server2_url = await SERVER.get_url(server2)
        let doc
        try {
            doc = await Openapi_Doc.load(server1_url)
            t.true(doc.info.version === doc1.info.version)
            doc = await Openapi_Doc.load(server2_url)
            t.true(doc.info.version === doc2.info.version)
        } catch (error) {
            t.fail(error.message)
        }
        try {
            doc = new Openapi_Doc(server1_url)
            await doc.load()
            t.true(doc.info.version === doc1.info.version)
            await doc.load(server2_url)
            t.true(doc.info.version === doc2.info.version)
        } catch (error) {
            t.fail(error.message)
        }
        server1.close()
        server2.close()
    }

    async function load_reload (t) {
        const doc = new Openapi_Doc
        await t.throwsAsync(async () => doc.load())
        await t.throwsAsync(async () => doc.reload())
        try {
            await doc.load(doc1)
            t.true(doc.info.version === doc1.info.version)
            await doc.load()
            t.true(doc.info.version === doc1.info.version)
            await doc.reload()
            t.true(doc.info.version === doc1.info.version)
        } catch (error) {
            t.fail(error.message)
        }
    }

    async function fail_doc_from_nonsense (t) {
        let doc
        doc = await t.throwsAsync(async () => Openapi_Doc.load(1))
        doc = new Openapi_Doc('deadend')
        doc = await t.throwsAsync(async () => doc.load())

        const zombie_path = join_paths(__dirname, 'fixtures', 'zombie.json')
        doc = await t.throwsAsync(async () => Openapi_Doc.load(zombie_path))

        const server = SERVER.create(
            (req, res) => res.end('{ "z": function (om) { return /bie/ } }'),
        )
        const server_url = await SERVER.get_url(server)
        doc = await t.throwsAsync(async () => Openapi_Doc.load(server_url))
        server.close()
    }

    async function validate_docs (t) {
        const good_doc = doc1
        const bad_doc = {
            ...doc1,
            nonsense: true,
        }
        try {
            doc = await Openapi_Doc.validate(good_doc)
            t.true(doc.info.version === good_doc.info.version)
            doc = await Openapi_Doc.validate(JSON.stringify(good_doc))
            t.true(doc.info.version === good_doc.info.version)
            doc = new Openapi_Doc(good_doc)
            await doc.load()
            await doc.validate()
            t.true(doc.info.version === good_doc.info.version)
        } catch (error) {
            t.fail(error.message)
        }
        doc = await t.throwsAsync(async () => Openapi_Doc.validate(bad_doc))
        doc = new Openapi_Doc(bad_doc)
        try {
            await doc.load()
        } catch (error) {
            t.fail(error.message)
        }
        doc = await t.throwsAsync(async () => doc.validate())
    }
}(
    require('ava'),
    require('path').join,
    {
        create: require('http').createServer,
        get_url: require('test-listen'),
    },
    require('./openapi-doc'),
    require('./fixtures/doc1.json'),
    require('./fixtures/doc2.json'),
))
