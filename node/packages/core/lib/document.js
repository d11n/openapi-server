(function main (FS, fetch_url, promisify, Definition, UTIL, ERROR) {
    const check_file_exists = promisify(FS.exists)
    const read_file_from_disk = promisify(FS.readFile)

    return module.exports = class Document {
        #source = null
        #loaded = false
        #options = {}
        #definition = null
        get definition () {
            return this.#definition
        }
        static get Definition () {
            return Definition
        }
        constructor (source, options = {}) {
            this.#source = source
            this.#options = options
            return this
        }
        static async create (...args) {
            return await construct(this, ...args)
        }
        static async load (...args) {
            return await load(...args)
        }
        async load (new_source, new_options = {}) {
            if (new_source) {
                this.#loaded = false
                this.#source = new_source
                this.#options = new_options
            } else if (this.#loaded) {
                return this
            }
            return await this.reload()
        }
        async reload () {
            if (!this.#source) {
                return ERROR.throw_error(ERROR.DOCUMENT_NO_SOURCE_MSG)
            }
            this.#definition = await load(
                this.constructor.Definition,
                this.#source,
                this.#options,
            )
            this.#loaded = true
            return this
        }
    }

    ///////////

    async function construct (Class, source, options = {}) {
        return new Class(source, options)
    }

    async function load (Definition_Class, source, options = {}) {
        let definition
        if (UTIL.is_not_inheritor(Definition_Class, Definition)) {
            return ERROR.throw_type_error(
                ERROR.SUBCLASS_OF_ERROR_MSG,
                'Definition_Class',
                'Definition',
            )
        }
        if (source && 'object' === typeof source) {
            definition = source
        } else if ('string' === typeof source) {
            if (is_url(source)) {
                definition = await get_from_url(source)
            } else {
                const file_exists = await check_file_exists(source)
                if (file_exists) {
                    definition = await get_from_disk(source)
                }
            }
        }
        return definition
            ? Definition_Class.create(definition, options)
            : ERROR.throw_error(ERROR.DOCUMENT_BAD_SOURCE_MSG)
    }

    ///////////

    async function get_from_disk (file_path) {
        try {
            console.log(file_path)
            debugger
            return await read_file_from_disk(file_path, 'utf8')
        } catch (error) {
            debugger
        }
    }

    async function get_from_url (url) {
        const response = await fetch_url(url)
        return response.data
    }

    ///////////

    function is_url (url) {
        return 'http://' === url.substring(0, 7)
            || 'https://' === url.substring(0, 8)
    }
}(
    require('fs'),
    require('axios').get,
    require('util').promisify,
    require('./definition'),
    require('./util'),
    require('./error'),
))
