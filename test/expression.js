/**
 * Decypher Expression Builder Unit Tests
 * =======================================
 *
 */
var assert = require('assert'),
    Expression = require('../index.js').Expression;

describe('Expression', function() {

  it('should be possible to use new or not.', function() {
    assert((new Expression()) instanceof Expression);
    assert(Expression() instanceof Expression);
  });

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

  it('should be possible to nest expressions.', function() {
    var expr = new Expression();

    expr
      .and('a = b')
      .or((new Expression())
        .or('b = c')
        .or('c = d')
        .and((new Expression()).and('bool2').or('bool2'))
      )
      .xor('d = e');

    assert.strictEqual(expr.compile(), 'a = b OR (b = c OR c = d AND (bool2 OR bool2)) XOR d = e');
  });

  it('should be possible to check whether an expression is empty.', function() {
    var expr = new Expression();

    assert(expr.isEmpty());

    expr.and(Expression());

    assert(expr.isEmpty());

    expr.or('test');

    assert.strictEqual(expr.compile(), 'test');
  });
});
