(function main (FS, fetch_url, promisify, Definition, ERROR) {
    const check_file_exists = promisify(FS.exists)
    const read_file_from_disk = promisify(FS.readFile)
    return module.exports = class Document {
        #source = null
        #loaded = false
        #options = {}
        definition = null
        constructor (source, options = {}) {
            this.#source = source
            this.#options = options
            return this
        }
        static get Definition () {
            return Definition
        }
        static async load (...args) {
            try {
                return await load(...args)
            } catch (error) {
                return ERROR.throw_error(error)
            }
        }
        async load (new_source, new_options = {}) {
            try {
                if (new_source || Object.keys(new_options).length) {
                    this.#loaded = false
                    this.#source = new_source
                    this.#options = new_options
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
                    return ERROR.throw_error(ERROR.DOCUMENT_NO_SOURCE_MSG)
                }
                this.#loaded = true
                this.definition = await load(
                    this.constructor.Definition,
                    this.#source,
                    this.#options,
                )
                return this
            } catch (error) {
                return ERROR.throw_error(error)
            }
        }
    }

    ///////////

    async function load (Definition_Class, source, options = {}) {
        let definition
        try {
            if (
                !(Definition_Class.prototype instanceof Definition)
                && Definition_Class !== Definition
            ) {
                return ERROR.throw_type_error(
                    ERROR.SUBCLASS_OF_ERROR_MSG,
                    'Definition_Class',
                    'Definition',
                )
            } else if (options && 'object' !== typeof options) {
                return ERROR.throw_type_error(
                    ERROR.TYPE_OF_ERROR_MSG,
                    'options',
                    'object',
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
                ? new Definition_Class(definition, options)
                : ERROR.throw_error(ERROR.DOCUMENT_BAD_SOURCE_MSG)
        } catch (error) {
            return ERROR.throw_error(error)
        }
    }

    ///////////

    async function get_from_disk (file_path) {
        try {
            return await read_file_from_disk(file_path, 'utf8')
        } catch (error) {
            return ERROR.throw_error(error)
        }
    }

    async function get_from_url (url) {
        try {
            const response = await fetch_url(url)
            return response.data
        } catch (error) {
            return ERROR.throw_error(error)
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
    require('util').promisify,
    require('./definition'),
    require('./error'),
))
