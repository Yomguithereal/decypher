/**
 * Decypher Query Builder
 * =======================
 *
 * Simple cypher query builder.
 */
var utils = require('./utils.js'),
    assign = utils.assign,
    isPlainObject = utils.isPlainObject,
    helpers = require('./helpers.js'),
    relationshipPattern = helpers.relationshipPattern,
    Expression = require('./expression.js');

var STATEMENTS = require('./syntax.js').STATEMENTS;

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

  if (!(this instanceof Query))
    return new Query();

  // Properties
  this._segments = [];
  this._params = {};
}

// Appending a segment to the query
Query.prototype.segment = function() {
  var query = new Query();

  this._segments.push(query);
  return query;
};

// Retrieving statements
Query.prototype.statements = function() {
  return this._segments.reduce(function(acc, segment) {
    return acc.concat(segment instanceof Query ? segment.statements() : segment);
  }, []);
};

// Compiling the query
Query.prototype.compile = function() {
  return this.statements().join('\n') + ';';
};
Query.prototype.toString = Query.prototype.compile;

// Retrieving or setting the query's parameters
Query.prototype.params = function(params) {

  // Retrieving
  if (!params) {
    var additionalParams = this._segments
      .filter(function(segment) {
        return segment instanceof Query;
      })
      .map(function(segment) {
        return segment.params();
      });

    return assign.apply(null, additionalParams.concat(this._params));
  }

  // Setting
  if (!isPlainObject(params))
    throw Error('decypher.Query.params: passed parameters should be a plain object.');

  assign(this._params, params);
  return this;
};

// Retrieving or setting a query's parameter
Query.prototype.param = function(key, value) {

  // Retrieving
  if (arguments.length < 2) {
    var params = this.params();
    return params[key];
  }

  // Setting
  var o = {};
  o[key] = value;
  return this.params(o);
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
STATEMENTS.concat(['']).forEach(function(statement) {
  var tokens = statement
    .toLowerCase()
    .split(' ');

  var methodName = statement ?
    tokens[0] + tokens.slice(1).map(capitalize).join('') :
    'add';

  Query.prototype[methodName] = function(parts, params) {
    var inner = null;

    // Solving arity 3
    if (methodName === 'foreach') {
      inner = params;
      params = arguments[2];
    }

    if (params && !isPlainObject(params))
      throw Error('decypher.Query.' + methodName + ': parameters should be a plain object.');

    if (methodName === 'foreach' && !inner)
      throw Error('decypher.Query.' + methodName + ': the FOREACH statement expects an inner query.');

    if (inner && typeof inner !== 'string' && !(inner instanceof Query))
      throw Error('decypher.Query.' + methodName + ': inner query should either be a string or another Query instance.');

    parts = [].concat(parts);

    var valid = parts.every(function(part) {
      return !!part &&
             typeof part === 'string' ||
             (part instanceof Expression && !part.isEmpty()) ||
             (!(part instanceof Expression) && isPlainObject(part));
    });

    if (!valid || !parts.length)
      throw Error('decypher.Query.' + methodName + ': first parameter should not be falsy or empty.');

    // Solving objects as relationship patterns
    parts = parts.map(function(part) {
      if (typeof part !== 'string' && !(part instanceof Expression))
        return relationshipPattern(part);
      return part;
    });

    var string = '';

    if (statement)
      string += statement + ' ';

    if (inner) {
      string += '(' + parts.join(',');

      if (inner instanceof Query) {
        this.params(inner.params());
        inner = inner.statements().join(' ');
      }

      string += ' | ' + inner + ')';
    }
    else {
      string += parts.join(', ');
    }

    this._segments.push(string);

    if (params)
      this.params(params);

    return this;
  };
});

module.exports = Query;
