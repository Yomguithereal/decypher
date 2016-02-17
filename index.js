/**
 * Decypher API
 * =============
 *
 * Exposing the library's modules.
 */
var loader = require('./src/loader.js'),
    helpers = require('./src/helpers.js'),
    Batch = require('./src/batch.js'),
    Expression = require('./src/expression.js'),
    Query = require('./src/query.js');

// Version
Object.defineProperty(loader, 'version', {
  value: '0.5.0'
});

// Attaching the other classes to the loader
loader.helpers = helpers;
loader.Batch = Batch;
loader.Expression = Expression;
loader.Query = Query;

// Exporting
module.exports = loader;
