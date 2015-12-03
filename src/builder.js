/**
 * Decypher Query Builder
 * =======================
 *
 * Simple cypher query builder.
 */
var assign = require('lodash.assign'),
    isPlainObject = require('lodash.isplainobject');

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

function capitalize(string) {
  return string.charAt(0).toUpperCase(string) + string.slice(1);
}

function QueryBuilder() {

  // Properties
  this._statements = [];
  this._params = {};
}

// Adding an arbitrary part to the query
QueryBuilder.prototype.add = function(part, params) {

  if (typeof part !== 'string')
    throw Error('decypher.QueryBuilder.add: first parameter should be a string.');

  if (params && !isPlainObject(params))
    throw Error('decypher.QueryBuilder.add: second parameter should be a plain object.');

  this._statements.push(part);

  if (params)
    assign(this._params, params);

  return this;
};

// Compiling the query
QueryBuilder.prototype.compile = function() {
  return this._statements.join('\n') + ';';
};

QueryBuilder.prototype.toString = QueryBuilder.prototype.compile;

// Retrieving the query's parameters
QueryBuilder.prototype.params = function(params) {
  if (!params)
    return this._params;

  if (!isPlainObject(params))
    throw Error('decypher.QueryBuilder.params: passed parameters should be a plain object.');

  assign(this._params, params);
  return this;
};

// Attaching a method to the prototype for each statement
STATEMENTS.forEach(function(statement) {
  var tokens = statement
    .toLowerCase()
    .split(' ');

  var methodName = tokens[0] + tokens.slice(1).map(capitalize).join('');

  QueryBuilder.prototype[methodName] = function(part, params) {

    if (typeof part !== 'string')
      throw Error('decypher.QueryBuilder.' + methodName + ': first parameter should be a string.');

    return this.add(statement + ' ' + part, params);
  };
});

module.exports = function() {
  return new QueryBuilder();
};
