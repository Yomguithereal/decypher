/**
 * Decypher Helpers Unit Tests
 * ============================
 *
 */
var assert = require('assert'),
    helpers = require('../index.js').helpers;

describe('Helpers', function() {

  describe('Escape', function() {

    it('should properly escape strings.', function() {
      assert.strictEqual(helpers.escape('simple string'), '"simple string"');
      assert.strictEqual(helpers.escape('complex " string'), '"complex \\" string"');
    });
  });

  describe('Escape identifier', function() {

    it('should properly escape identifiers.', function() {
      assert.strictEqual(helpers.escapeIdentifier('identifier'), 'identifier');
      assert.strictEqual(helpers.escapeIdentifier('complex identifier'), '`complex identifier`');
      assert.strictEqual(helpers.escapeIdentifier('silly [!!] identifier'), '`silly [!!] identifier`');
      assert.strictEqual(helpers.escapeIdentifier('dangerous ` identifier'), '`dangerous `` identifier`');
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
        '-[`r 1`:`COMPLEX PREDICATE`]-'
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
        {identifier: 'r 1', predicate: 'COMPLEX PREDICATE'}
      ];

      patterns.forEach(function(pattern, i) {
        assert.strictEqual(helpers.relationshipPattern(descriptors[i]), pattern);
      });
    });
  });
});
