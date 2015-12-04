/**
 * Decypher Helpers Unit Tests
 * ============================
 *
 */
var assert = require('assert'),
    helpers = require('../index.js').helpers;

describe('Helpers', function() {

  describe('Escape identifier', function() {

    it('should properly escape identifiers.', function() {
      assert.strictEqual(helpers.escapeIdentifier('identifier'), 'identifier');
      assert.strictEqual(helpers.escapeIdentifier('complex identifier'), '`complex identifier`');
      assert.strictEqual(helpers.escapeIdentifier('silly [!!] identifier'), '`silly [!!] identifier`');
      assert.strictEqual(helpers.escapeIdentifier('dangerous ` identifier'), '`dangerous `` identifier`');
    });
  });

  describe('Escape literal map', function() {

    it('should properly escape literal maps.', function() {

      assert.deepEqual(helpers.escapeLiteralMap({hello: 'world', number: 2}), '{hello: "world", number: 2}');
      assert.deepEqual(helpers.escapeLiteralMap({'problematic key': 'bad'}), '{`problematic key`: "bad"}');
    });
  });

  describe('Relationship pattern', function() {

    it('should properly build relationship patterns.', function() {
      var patterns = [
        '--',
        '<--',
        '-->',
        '-[r]-',
        '<-[r]-',
        '-[r]->',
        '-[:PREDICATE]->',
        '<-[r:PREDICATE]-',
        '-[`r 1`:`COMPLEX PREDICATE`]-',
        '-[r:PREDICATE {param}]->',
        '-[{name: "John"}]-',
        '<-[r:PREDICATE {number: 1, name: "John"}]-'
      ];

      var descriptors = [
        undefined,
        {direction: 'in'},
        {direction: 'out'},
        {identifier: 'r'},
        {direction: 'in', identifier: 'r'},
        {direction: 'out', identifier: 'r'},
        {direction: 'out', predicate: 'PREDICATE'},
        {direction: 'in', identifier: 'r', predicate: 'PREDICATE'},
        {identifier: 'r 1', predicate: 'COMPLEX PREDICATE'},
        {direction: 'out', 'identifier': 'r', predicate: 'PREDICATE', data: 'param'},
        {data: {name: 'John'}},
        {direction: 'in', identifier: 'r', predicate: 'PREDICATE', data: {number: 1, name: 'John'}}
      ];

      patterns.forEach(function(pattern, i) {
        assert.strictEqual(helpers.relationshipPattern(descriptors[i]), pattern);
      });
    });
  });
});
