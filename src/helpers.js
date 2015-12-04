/**
 * Decypher Helpers
 * =================
 *
 * Miscellaneous helper functions.
 */
var isPlainObject = require('lodash.isplainobject');

var KEYWORDS = require('./syntax.js').KEYWORDS;

// Escaping an identifier
function escapeIdentifier(identifier) {

  if (/\W/.test(identifier) || KEYWORDS[identifier.toUpperCase()])
    return '`' + identifier.replace(/`/g, '``') + '`';

  return identifier;
}

// Stringify a literal map
function escapeLiteralMap(object) {
  if (!isPlainObject(object))
    throw Error('decypher.helpers.literalMap: given argument should be a plain object.');

  var string = '{';

  string += Object.keys(object).map(function(k) {
    return escapeIdentifier(k) + ': ' + JSON.stringify(object[k]);
  }).join(', ');

  return string + '}';
}

// Create a relationship pattern
function relationshipPattern(opts) {
  opts = opts || {};

  if (!isPlainObject(opts))
    throw Error('decypher.helpers.relationshipPattern: given options should be a plain object.');

  var pattern = '';

  if (opts.direction === 'in')
    pattern += '<-';
  else
    pattern += '-';

  if (opts.identifier || opts.predicate || opts.data) {
    pattern += '[';

    if (opts.identifier)
      pattern += escapeIdentifier(opts.identifier);

    if (opts.predicate)
      pattern += ':' + escapeIdentifier(opts.predicate);

    if (opts.data) {
      if (opts.identifier || opts.predicate)
        pattern += ' ';

      if (typeof opts.data === 'string')
        pattern += '{' + opts.data + '}';
      else
        pattern += escapeLiteralMap(opts.data);
    }

    pattern += ']';
  }

  if (opts.direction === 'out')
    pattern += '->';
  else
    pattern += '-';

  return pattern;
}

module.exports = {
  escapeIdentifier: escapeIdentifier,
  escapeLiteralMap: escapeLiteralMap,
  relationshipPattern: relationshipPattern
};
