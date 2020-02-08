# OpenAPI Express Server

Work-in-progress. Install at your own peril. Or curiosity.

## Installation

```
npm add @openapi-server/express
```

## Basic Usage

#### ./index.js

```js
(async function main (CONFIG, join_paths, { Openapi_Express_Server }) {
    try {
        const openapi_doc_path = join_paths(__dirname, 'openapi.yaml')
        const app = new Openapi_Express_Server({
            doc: openapi_doc_path,
            dir: __dirname,
        })
        return await app.listen(
            CONFIG.port,
            () => console.log(`port=${ CONFIG.port }!`),
        )
    } catch (error) {
        throw error
    }
}(
    require('../config'),
    require('path').join,
    require('@openapi-server/express'),
))
```

#### ./operations/{operationId}.js

Export a normal Express route callback for each `operationId`:

```js
module.exports = function list_users(request, response, next) {
    ...
}
```
