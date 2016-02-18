/**
 * Decypher Expression Builder
 * ============================
 *
 * Simple cypher expression builder.
 */

/**
 * Class.
 */
function Expression(firstString) {

  if (!(this instanceof Expression))
    return new Expression(firstString);

  // Properties
  this._parts = [];

  if (firstString)
    this.and(firstString);
}

// Adding methods to the prototype
['and', 'or', 'xor'].forEach(function(operator) {
  Expression.prototype[operator] = function(string) {
    this._parts.push({operator: operator, value: string});
    return this;
  };
});

// Compiling the expression to string
Expression.prototype.compile = function() {
  var string = '',
      part,
      i,
      l;

  for (i = 0, l = this._parts.length; i < l; i++) {
    part = this._parts[i];

    if (i)
      string += ' ' + part.operator.toUpperCase() + ' ';

    if (part.value instanceof Expression)
      string += '(' + part.value.compile() + ')';
    else
      string += part.value;
  }

  return string;
};
Expression.prototype.toString = Expression.prototype.compile;

module.exports = Expression;
