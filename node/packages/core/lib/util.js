(function main (ERROR) {
    return module.exports = {
        get_options,
        is_inheritor,
        is_not_inheritor,
    }

    ///////////

    function get_options (options) {
        return (options && 'object' === typeof options)
            ? options
            : {}
    }

    function is_inheritor (Subclass, Parent) {
        if ('function' !== typeof Subclass) {
            return ERROR.throw_type_error(ERROR.CLASS_ERROR_MSG, 'Subclass')
        } else if ('function' !== typeof Parent) {
            return ERROR.throw_type_error(ERROR.CLASS_ERROR_MSG, 'Parent')
        }
        return Subclass.prototype instanceof Parent
            || Subclass === Parent
    }

    function is_not_inheritor (...args) {
        return !is_inheritor(...args)
    }
}(
    require('./error'),
))
