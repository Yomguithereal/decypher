/**
 * Decypher Expression Builder Unit Tests
 * =======================================
 *
 */
var assert = require('assert'),
    Expression = require('../index.js').Expression;

describe('Expression', function() {

  it('should be possible to build a simple expression.', function() {
    var expr = new Expression();

    expr.and('a = b').and('b = c');

    assert.strictEqual(expr.compile(), 'a = b AND b = c');
    assert.strictEqual('' + expr, 'a = b AND b = c');
  });

  it('should be possible to pass an initial part.', function() {
    var expr = new Expression('a = b');

    expr.and('b = c');

    assert.strictEqual(expr.compile(), 'a = b AND b = c');
  });
});
