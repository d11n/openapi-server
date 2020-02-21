(function main (Ajv, METASCHEMA, Definition, UTIL, ERROR) {
    return module.exports = class Json_Schema_Definition extends Definition {
        #version = null // not used directly, but useful for debugging
        #validator = null
        constructor (params) {
            super()
            this.#version = params.version
            this.#validator = params.validator
        }
        static async validate (...args) {
            return await validate_schema(...args).catch(ERROR.throw)
        }
        async validate (...args) {
            return await validate_data(this, this.#validator, ...args).catch(ERROR.throw)
        }
    }

    ///////////

    async function validate_schema (schema, options = {}) {
        const version = determine_version(schema, options.version)
        const ajv = get_ajv_instance(version, options)
        let validator
        try {
            validator = ajv.compile(schema)
        } catch (error) {
            return ajv.errors
                ? ERROR.throw(
                    ERROR.JSON_SCHEMA_VALIDATION_MSG,
                    ajv.errors[0].dataPath,
                    ajv.errors[0].message,
                )
                : ERROR.throw(error)
        }
        return {
            ...schema,
            __validator: validator,
            __version: version,
        } // ^ __ props are fed to the constructor
    }

    async function validate_data (instance, data_validator, data) {
        if (data_validator(data)) {
            return instance
        }
        return ERROR.throw(
            ERROR.JSON_SCHEMA_VALIDATION_MSG,
            data_validator.errors[0].dataPath,
            data_validator.errors[0].message,
        )
    }

    ///////////

    function determine_version(schema, version) {
        const schema_version = get_version(schema)
        const passed_version = get_version(version)
        if (schema_version && !passed_version) {
            return schema_version
        } else if (!schema_version && passed_version) {
            return passed_version
        } else if (!schema_version && !passed_version) {
            return ERROR.throw(ERROR.JSON_SCHEMA_NO_VERSION_MSG)
        } else if (schema_version === passed_version) {
            return schema_version
        }
        return ERROR.throw(
            ERROR.JSON_SCHEMA_VERSION_MISMATCH_MSG,
            schema_version,
            passed_version,
        )
    }

    function get_version (version_arg) {
        const raw_version = (version_arg && 'object' === typeof version_arg)
            ? version_arg.$schema
            : version_arg
        if ([ undefined, null ].includes(raw_version)) {
            return null
        }
        const supported_version_list = [ 4, 6, 7 ]
        const unsupported_version_list = [ 201909 ]
        const version_test = Math.round(String(raw_version).replace(/\D/g, ''))
        // ^ Just to support multiple ways version might be expressed, like:
        //     - "draft-06"
        //     - "draft6"
        //     - "06"
        //     - "6"
        //     - 6
        //     - "http://json-schema.org/draft-06/schema#"
        //     - etc.
        const version = {
            0: 'draft-00',
            1: 'draft-01',
            2: 'draft-02',
            3: 'draft-03',
            4: 'draft-04',
            5: 'draft-05',
            6: 'draft-06',
            7: 'draft-07',
            201909: '2019-09',
        }[version_test]

        if (supported_version_list.includes(version_test)) {
            return version
        } else if (unsupported_version_list.includes(version_test)) {
            return ERROR.throw(
                ERROR.JSON_SCHEMA_VERSION_TOO_EDGE_MSG,
                version,
            )
        }
        return ERROR.throw(
            ERROR.JSON_SCHEMA_INVALID_VERSION_MSG,
            raw_version,
        )
    }

    function get_ajv_instance(version, options) {
        let ajv
        const ajv_options = {
            logger: false,
            formats: options.formats || {},
        }
        switch (version) {
            case 'draft-07':
                return new Ajv(ajv_options)
            case 'draft-06':
                ajv = new Ajv(ajv_options)
                ajv.addMetaSchema(METASCHEMA['draft-06'])
                return ajv
            case 'draft-04':
                ajv = new Ajv({ ...ajv_options, schemaId: 'id' })
                ajv.addMetaSchema(METASCHEMA['draft-04'])
                return ajv
        }
        // Not possible unless get_ajv_instance() is out of sync with
        // get_version()'s supported_versions_list
    }
}(
    require('ajv'),
    {
        'draft-06': require('ajv/lib/refs/json-schema-draft-06.json'),
        'draft-04': require('ajv/lib/refs/json-schema-draft-04.json'),
    },
    require('../definition'),
    require('../util'),
    require('../error'),
))
