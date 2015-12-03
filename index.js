/**
 * Decypher API
 * =============
 *
 * Exposing the library's modules.
 */
var loader = require('./src/loader.js');

// Version
Object.defineProperty(loader, 'version', {
  value: '0.1.2'
});

// Exporting
module.exports = loader;
