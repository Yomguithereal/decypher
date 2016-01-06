/**
 * Decypher Helpers
 * =================
 *
 * Miscellaneous helper functions.
 */
var isPlainObject = require('lodash.isplainobject'),
    escapeRegexp = require('escape-regexp'),
    syntax = require('./syntax.js');

var KEYWORDS = syntax.KEYWORDS,
    REGEX_FLAGS = syntax.REGEX_FLAGS;

// Escaping an identifier
function escapeIdentifier(identifier) {

  if (/\W/.test(identifier) || KEYWORDS[identifier.toUpperCase()])
    return '`' + identifier.replace(/`/g, '``') + '`';

  return identifier;
}

// Stringifying a literal map
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

// Creating a node pattern
function nodePattern(opts) {
  opts = opts || {};

  if (typeof opts === 'string')
    return nodePattern({identifier: opts});

  if (!isPlainObject(opts))
    throw Error('decypher.helpers.nodePattern: given options should be a plain object.');

  var pattern = '(';

  if (opts.identifier)
    pattern += escapeIdentifier(opts.identifier);

  if (opts.label)
    pattern += ':' + escapeIdentifier(opts.label);

  if (opts.data) {
    if (opts.identifier || opts.label)
      pattern += ' ';

    if (typeof opts.data === 'string')
      pattern += '{' + opts.data + '}';
    else
      pattern += escapeLiteralMap(opts.data, opts.paramKeys);
  }

  return pattern + ')';
}

// Creating a relationship pattern
function relationshipPattern(opts) {
  opts = opts || {};

  if (typeof opts === 'string')
    return relationshipPattern({identifier: opts});

  if (!isPlainObject(opts))
    throw Error('decypher.helpers.relationshipPattern: given options should be a plain object.');

  var pattern = '';

  if (opts.source)
    pattern += nodePattern(opts.source);

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

  if (opts.target)
    pattern += nodePattern(opts.target);

  return pattern;
}

// Creating a search pattern
function searchPattern(query, opts) {
  opts = opts || {};

  if (typeof query !== 'string')
    throw Error('decypher.helpers.searchPattern: given query should be a string.');

  var flags = 'flags' in opts ? opts.flags : 'ius',
      partial = opts.partial !== false;

  if (typeof flags === 'string') {
    if (flags.split('').some(function(flag) {
      return !REGEX_FLAGS[flag];
    }))
      throw Error('decypher.helpers.searchPattern: invalid flags "' + flags + '".');
  }

  var pattern = '';

  if (flags)
    pattern += '(?' + flags + ')';

  if (partial)
    pattern += '.*';

  pattern += escapeRegexp(query);

  if (partial)
    pattern += '.*';

  return pattern;
}

module.exports = {
  escapeIdentifier: escapeIdentifier,
  escapeLiteralMap: escapeLiteralMap,
  nodePattern: nodePattern,
  relationshipPattern: relationshipPattern,
  searchPattern: searchPattern
};
