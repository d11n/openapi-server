(function main () {
    return module.exports = function getRoot (request, response, next) {
        return response.json('{ "root": true }')
    }
}())
