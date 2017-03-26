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

// Checking whether the expression is empty
Expression.prototype.isEmpty = function() {
  return !this.compile();
};

// Compiling the expression to string
Expression.prototype.compile = function() {
  var string = '',
      value,
      part,
      i,
      l;

  for (i = 0, l = this._parts.length; i < l; i++) {
    part = this._parts[i];

    if (string)
      string += ' ' + part.operator.toUpperCase() + ' ';

    if (part.value instanceof Expression) {
      value = part.value.compile();
      if (!!value)
        string += '(' + value + ')';
    }
    else {
      string += part.value;
    }
  }

  return string;
};
Expression.prototype.toString = Expression.prototype.compile;

// Convenient inspect method
Expression.prototype.inspect = function() {
  return 'Expression (' + this.toString() + ')';
};

module.exports = Expression;
