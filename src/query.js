/**
 * Decypher Query Builder
 * =======================
 *
 * Simple cypher query builder.
 */
var assign = require('lodash.assign'),
    isPlainObject = require('lodash.isplainobject');

/**
 * Constants.
 */
const STATEMENTS = [
  'ASSERT',
  'CASE',
  'CREATE',
  'CREATE CONSTRAINT ON',
  'CREATE INDEX ON',
  'CREATE UNIQUE',
  'DELETE',
  'DROP CONSTRAINT ON',
  'DROP INDEX ON',
  'ELSE',
  'FOREACH',
  'LIMIT',
  'MATCH',
  'MERGE',
  'ON CREATE SET',
  'ON MATCH SET',
  'OPTIONAL MATCH',
  'ORDER BY',
  'REMOVE',
  'RETURN',
  'SET',
  'SKIP',
  'START',
  'THEN',
  'UNION',
  'UNION ALL',
  'UNWIND',
  'USING INDEX',
  'WITH',
  'WHERE'
];

/**
 * Helpers.
 */
function capitalize(string) {
  return string.charAt(0).toUpperCase(string) + string.slice(1);
}

/**
 * Class.
 */
function Query() {

  // Properties
  this._statements = [];
  this._params = {};
}

// Adding an arbitrary part to the query
Query.prototype.add = function(part, params) {

  if (typeof part !== 'string')
    throw Error('decypher.Query.add: first parameter should be a string.');

  if (params && !isPlainObject(params))
    throw Error('decypher.Query.add: second parameter should be a plain object.');

  this._statements.push(part);

  if (params)
    assign(this._params, params);

  return this;
};

// Retrieving statements
Query.prototype.statements = function() {
  return this._statements.slice(0);
};

// Compiling the query
Query.prototype.compile = function() {
  return this._statements.join('\n') + ';';
};
Query.prototype.toString = Query.prototype.compile;

// Retrieving the query's parameters
Query.prototype.params = function(params) {
  if (!params)
    return this._params;

  if (!isPlainObject(params))
    throw Error('decypher.Query.params: passed parameters should be a plain object.');

  assign(this._params, params);
  return this;
};

// Building the query
Query.prototype.build = function() {
  return {
    query: this.compile(),
    params: this.params(),
    statements: this.statements()
  };
};

// Attaching a method to the prototype for each statement
STATEMENTS.forEach(function(statement) {
  var tokens = statement
    .toLowerCase()
    .split(' ');

  var methodName = tokens[0] + tokens.slice(1).map(capitalize).join('');

  Query.prototype[methodName] = function(part, params) {

    if (typeof part !== 'string')
      throw Error('decypher.Query.' + methodName + ': first parameter should be a string.');

    return this.add(statement + ' ' + part, params);
  };
});

module.exports = Query;
