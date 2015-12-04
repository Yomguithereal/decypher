/**
 * Decypher Helpers
 * =================
 *
 * Miscellaneous helper functions.
 */
var isPlainObject = require('lodash.isplainobject');

var KEYWORDS = require('./syntax.js').KEYWORDS;

// Escaping a string
function escape(string) {
  return '"' + ('' + string).replace(/"/g, '\\"') + '"';
}

// Escaping an identifier
function escapeIdentifier(identifier) {

  if (/\W/.test(identifier) || KEYWORDS[identifier.toUpperCase()])
    return '`' + identifier.replace(/`/g, '``') + '`';

  return identifier;
}

// Create a relationship pattern
function relationshipPattern(opts) {
  opts = opts || {};

  if (!isPlainObject(opts))
    throw Error('decypher.helpers.relationshipPattern: given options should be an object.');

  var pattern = '';

  if (opts.direction === 'in')
    pattern += '<-';
  else
    pattern += '-';

  if (opts.identifier || opts.predicate) {
    pattern += '[';

    if (opts.identifier)
      pattern += escapeIdentifier(opts.identifier);

    if (opts.predicate)
      pattern += ':' + escapeIdentifier(opts.predicate);

    pattern += ']';
  }

  if (opts.direction === 'out')
    pattern += '->';
  else
    pattern += '-';

  return pattern;
}

module.exports = {
  escape: escape,
  escapeIdentifier: escapeIdentifier,
  relationshipPattern: relationshipPattern
};
