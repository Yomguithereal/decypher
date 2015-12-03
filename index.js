/**
 * Decypher API
 * =============
 *
 * Exposing the library's modules.
 */
var loader = require('./src/loader.js'),
    builder = require('./src/builder.js');

// Version
Object.defineProperty(loader, 'version', {
  value: '0.2.0'
});

// Attaching the other classes to the loader
loader.batch = null;
loader.builder = builder;

// Exporting
module.exports = loader;
