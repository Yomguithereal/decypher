/**
 * Decypher Query Builder Unit Tests
 * ==================================
 *
 */
var assert = require('assert'),
    Query = require('../index.js').Query;

describe('Query', function() {

  it('should be possible to build a simple query.', function() {
    var query = new Query()
      .match('(n:Label)')
      .where('n.title = "whatever"')
      .orderBy('n.title')
      .return('n');

    var expected = [
      'MATCH (n:Label)',
      'WHERE n.title = "whatever"',
      'ORDER BY n.title',
      'RETURN n'
    ];

    assert.deepEqual(query.statements(), expected);
    assert.strictEqual(query.compile(), expected.join('\n') + ';');
    assert.strictEqual(query.compile(), query.toString());
    assert.deepEqual(query.params(), {});
    assert.deepEqual(query.build(), {
      query: query.compile(),
      params: query.params(),
      statements: query.statements()
    });
  });

  it('should be possible to pass parameters on the fly.', function() {
    var query = new Query()
      .match('(n:Label)')
      .where('n.title = {title}', {title: 'whatever'})
      .orderBy('n.title')
      .limit('{limit}', {limit: 10})
      .skip('{offset}', {offset: 5})
      .return('n');

    var expected = [
      'MATCH (n:Label)',
      'WHERE n.title = {title}',
      'ORDER BY n.title',
      'LIMIT {limit}',
      'SKIP {offset}',
      'RETURN n;'
    ];

    assert.strictEqual(query.compile(), expected.join('\n'));
    assert.deepEqual(query.params(), {
      title: 'whatever',
      limit: 10,
      offset: 5
    });
  });

  it('should be possible to pass every parameters at once.', function() {
    var query = new Query()
      .match('(n:Label)')
      .where('n.title = {title}')
      .orderBy('n.title')
      .limit('{limit}')
      .skip('{offset}')
      .return('n')
      .params({
        title: 'whatever',
        limit: 10,
        offset: 5
      });

    var expected = [
      'MATCH (n:Label)',
      'WHERE n.title = {title}',
      'ORDER BY n.title',
      'LIMIT {limit}',
      'SKIP {offset}',
      'RETURN n;'
    ];

    assert.strictEqual(query.compile(), expected.join('\n'));
    assert.deepEqual(query.params(), {
      title: 'whatever',
      limit: 10,
      offset: 5
    });
  });

  it('should be possible to chain matches.', function() {
    var query = new Query()
      .match('(n:Label)')
      .match('(o:Other)')
      .where('n.title = "whatever"')
      .orderBy('n.title')
      .return('n');

    var expected = [
      'MATCH (n:Label)',
      'MATCH (o:Other)',
      'WHERE n.title = "whatever"',
      'ORDER BY n.title',
      'RETURN n;'
    ];

    assert.strictEqual(query.compile(), expected.join('\n'));
  });

  it('should be possible to add arbitrary parts.', function() {
    var query = new Query()
      .add('THIS is not valid')
      .add('BUT could very well be')
      .return('the future');

    var expected = [
      'THIS is not valid',
      'BUT could very well be',
      'RETURN the future;'
    ];

    assert.strictEqual(query.compile(), expected.join('\n'));
  });

  it('should be possible to add multipart statements.', function() {
    var query = new Query()
      .create(['(a:Actor)', '(b:Film)'])
      .return('a, b');

    var expected = [
      'CREATE (a:Actor), (b:Film)',
      'RETURN a, b'
    ];

    assert.deepEqual(query.statements(), expected);
    assert.strictEqual(query.compile(), expected.join('\n') + ';');
  });
});
