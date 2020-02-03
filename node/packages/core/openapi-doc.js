(function main (FS, fetch_url, parse_yaml, Swagger_Parser, UTIL) {
    const { promisify, ERROR } = UTIL
    const check_file_exists = promisify(FS.exists)
    const read_file_from_disk = promisify(FS.readFile)

    class Openapi_Doc {
        #source = null
        #loaded = false
        constructor (doc_arg) {
            this.#source = doc_arg
            return this
        }
        async load (new_source) {
            try {
                if (new_source) {
                    this.#loaded = false
                    this.#source = new_source
                } else if (this.#loaded) {
                    return this
                }
                return await this.reload()
            } catch (error) {
                return ERROR.throw_error(error)
            }
        }
        async reload () {
            try {
                if (!this.#source) {
                    return ERROR.throw_error(ERROR.NO_OPENAPI_DOC_SOURCE_ERROR)
                }
                this.#loaded = true
                const doc = await load(this.#source)
                Object.assign(this, doc)
                return this
            } catch (error) {
                return ERROR.throw_error(error)
            }
        }
        async validate (...args) {
            try {
                const doc = await validate(this)
                Object.assign(this, doc)
                return this
            } catch (error) {
                return ERROR.throw_error(error)
            }
        }
    }
    Object.assign(Openapi_Doc, {
        load: load,
        validate: validate,
    })
    return module.exports = Openapi_Doc

    ///////////

    async function load (doc_arg) {
        try {
            if ('string' !== typeof doc_arg) {
                return doc_arg
            } else if (is_url(doc_arg)) {
                return await get_from_url(doc_arg)
            } else {
                const file_exists = await check_file_exists(doc_arg)
                if (file_exists) {
                    return await get_from_disk(doc_arg)
                }
            }
            return ERROR.throw_error(ERROR.BAD_OPENAPI_DOC_ARG_MSG)
        } catch (error) {
            return ERROR.throw_error(error)
        }
    }

    async function validate (raw_doc) {
        try {
            const doc = 'string' === typeof raw_doc
                ? parse_yaml(raw_doc)
                : raw_doc
            const parser = new Swagger_Parser
            // ^ instantiate because Swagger_Parser.validate() throws:
            //       Class is not a constructor
            const valid_doc = await parser.validate(doc, {})
            // ^ if options isn't passed, validate() throws:
            //       Cannot read property 'dereference' of undefined
            return valid_doc
        } catch (error) {
            return ERROR.throw_error(error)
        }
    }

    ///////////

    async function get_from_disk (file_path) {
        try {
            const doc_string = await read_file_from_disk(file_path, 'utf8')
            return parse_yaml(doc_string)
        } catch (error) {
            return error
        }
    }

    async function get_from_url (url) {
        try {
            const doc_string = await fetch_url(url)
            return parse_yaml(doc_string)
        } catch (error) {
            return error
        }
    }

    ///////////

    function is_url (url) {
        return 'http://' === url.substring(0, 7)
            || 'https://' === url.substring(0, 8)
    }
}(
    require('fs'),
    require('axios').get,
    require('js-yaml').safeLoad,
    require('swagger-parser'),
    {
        promisify: require('util').promisify,
        ERROR: require('./error'),
    },
))
