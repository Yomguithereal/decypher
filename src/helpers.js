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
function escapeLiteralMap(object, paramKeys) {
  if (!isPlainObject(object))
    throw Error('decypher.helpers.escapeLiteralMap: first argument should be a plain object.');

  paramKeys = paramKeys || [];

  if (!Array.isArray(paramKeys))
    throw Error('decypher.helpers.escapeLiteralMap: second argument should be an array.');

  var string = '{';

  string += Object.keys(object).map(function(k) {
    var value = ~paramKeys.indexOf(k) ?
      '{' + object[k] + '}' :
      JSON.stringify(object[k]);

    return escapeIdentifier(k) + ': ' + value;
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
      pattern += [].concat(opts.predicate).map(function(predicate) {
        return ':' + escapeIdentifier(predicate);
      }).join('|');

    if (opts.data) {
      if (opts.identifier || opts.predicate)
        pattern += ' ';

      if (typeof opts.data === 'string')
        pattern += '{' + opts.data + '}';
      else
        pattern += escapeLiteralMap(opts.data, opts.paramKeys);
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
