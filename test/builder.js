/**
 * Decypher Query Builder Unit Tests
 * ==================================
 *
 */
var assert = require('assert'),
    cypher = require('../index.js').cypher;

describe('Query Builder', function() {

  it('should be possible to build a simple query.', function() {
    var query = cypher()
      .match('(n:Label)')
      .where('n.title = "whatever"')
      .orderBy('n.title')
      .return('n');

    var expected = [
      'MATCH (n:Label)',
      'WHERE n.title = "whatever"',
      'ORDER BY n.title',
      'RETURN n;'
    ];

    assert.strictEqual(query.compile(), expected.join('\n'));
    assert.strictEqual(query.compile(), query.toString());
    assert.deepEqual(query.params(), {});
  });
});
