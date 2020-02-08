(function main (test, ERROR) {
    // Config these two constants as edits are made to error.js
    const NON_MESSAGE_MEMBER_LIST = [
        'get_error',
        'get_type_error',
        'throw_error',
        'throw_type_error',
    ]
    const ARG_COUNT_DICT = {
        BAD_DOC_ARG_MSG: 0,
        MISSING_OPERATION_ID_MSG: 2,
        NO_DOC_SOURCE_ERROR_MSG: 0,
        EXPRESS_NO_OPERATIONS_DIR_MSG: 1,
    }

    test.before(build_context_before_all_tests)

    test('error from single string', string_error, 'error', Error)
    test('error from string array', array_error, 'error', Error)

    test('type error from single string', string_error, 'type_error', TypeError)
    test('type error from string array', array_error, 'type_error', TypeError)

    test('type error is coerced', coerce_type_error)

    for (const message_name of Object.keys(ARG_COUNT_DICT)) {
        test(
            `${ message_name } args present`,
            message_args_present,
            ERROR[message_name],
            ARG_COUNT_DICT[message_name],
        )
    }
    test('all error messages configured', all_messages_configured)

    /////////// Macros

    function string_error (t, error_type, Type) {
        const error = ERROR[`get_${ error_type }`]('a')
        t.true(error instanceof Type)
        t.is(error.message, 'a')
        t.throws(() => ERROR[`throw_${ error_type }`](error))
    }

    function array_error (t, error_type, Type) {
        const error = ERROR[`get_${ error_type }`]([ 'a', 'b' ])
        t.true(error instanceof Type)
        t.is(error.message, 'a b')
        t.throws(() => ERROR[`throw_${ error_type }`](error))
    }

    function message_args_present(t, raw_message, args_present) {
        const { impossible_word_list, impossible_regex_list } = t.context
        const { message } = ERROR.get_error(
            raw_message,
            ...impossible_word_list,
        )
        let correct_words_found = true
        for (let i = 0, n = impossible_word_list.length - 1; i <= n; i++) {
            correct_words_found = correct_words_found && (
                i < args_present
                    ? impossible_regex_list[i].test(message)
                    : !impossible_regex_list[i].test(message)
            )
        }
        t.true(
            correct_words_found,
            'all configured args are not present in error message',
        )
    }

    /////////// Tests

    function coerce_type_error (t) {
        const error = ERROR.get_error('a')
        t.throws(() => ERROR.throw_type_error(error), {
            instanceOf: TypeError,
        })
    }

    function all_messages_configured (t) {
        const { message_member_list } = t.context
        t.plan(message_member_list.length)
        for (const message_name of message_member_list) {
            const arg_count = ARG_COUNT_DICT[message_name]
            t.true(
                Number.isInteger(arg_count) && arg_count >= 0,
                `${ message_name } missing from ARG_COUNT_DICT`,
            )
        }
    }

    /////////// Hooks

    function build_context_before_all_tests (t) {
        // Make sure to fail when new messages are added to error.js,
        // but are not configured in error.test.js
        t.context.message_member_list = Object.keys(ERROR)
            .filter((key) => !NON_MESSAGE_MEMBER_LIST.includes(key))

        // Make sure every configured arg shows up in resulting error messages
        t.context.impossible_word_list = [
            'Xu9kAa0Nef3',
            'ih81kK1pazC',
            'L822qxrTAju',
        ]
        t.context.impossible_regex_list = t.context.impossible_word_list
            .map((word) => new RegExp(`\\b${ word }\\b`))
    }
}(
    require('ava'),
    require('./error'),
))
