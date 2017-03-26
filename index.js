/**
 * Decypher API
 * =============
 *
 * Exposing the library's modules.
 */
var loader = require('./loader.js'),
    helpers = require('./helpers.js'),
    Batch = require('./batch.js'),
    Expression = require('./expression.js'),
    Query = require('./query.js');

// Attaching the other classes to the loader
loader.loader = loader;
loader.helpers = helpers;
loader.Batch = Batch;
loader.Expression = Expression;
loader.Query = Query;

// Exporting
module.exports = loader;
