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

      assert.strictEqual(helpers.escapeLiteralMap({hello: 'world', number: 2}), '{hello: "world", number: 2}');
      assert.strictEqual(helpers.escapeLiteralMap({'problematic key': 'bad'}), '{`problematic key`: "bad"}');
    });

    it('should be possible to indicate parameter keys.', function() {
      assert.strictEqual(helpers.escapeLiteralMap({name: 'name'}, ['name']), '{name: {name}}');
    });
  });

  describe('Node pattern', function() {

    it('should properly build node patterns.', function() {
      var patterns = [
        '()',
        '(n)',
        '(n:Label)',
        '(:Label)',
        '(:Label1:Label2)',
        '({name: "John"})',
        '(n {name: {name}})',
        '(:Label {params})',
        '(n)'
      ];

      var descriptors = [
        undefined,
        {identifier: 'n'},
        {identifier: 'n', label: 'Label'},
        {label: 'Label'},
        {labels: ['Label1', 'Label2']},
        {data: {name: 'John'}},
        {identifier: 'n', data: {name: 'name'}, paramKeys: ['name']},
        {label: 'Label', data: 'params'},
        'n'
      ];

      patterns.forEach(function(pattern, i) {
        assert.strictEqual(helpers.nodePattern(descriptors[i]), pattern);
      });
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
        '<-[r:PREDICATE {number: 1, name: "John"}]-',
        '-[r {name: {name}}]->',
        '-[r:ONE|:TWO]->',
        '-[r]-',
        '(a)-[:PLAYED_IN]->(m:Movie)'
      ];

      var descriptors = [
        undefined,
        {direction: 'in'},
        {direction: 'out'},
        {identifier: 'r'},
        {direction: 'in', identifier: 'r'},
        {direction: 'out', identifier: 'r'},
        {direction: 'out', type: 'PREDICATE'},
        {direction: 'in', identifier: 'r', type: 'PREDICATE'},
        {identifier: 'r 1', type: 'COMPLEX PREDICATE'},
        {direction: 'out', 'identifier': 'r', type: 'PREDICATE', data: 'param'},
        {data: {name: 'John'}},
        {direction: 'in', identifier: 'r', type: 'PREDICATE', data: {number: 1, name: 'John'}},
        {direction: 'out', identifier: 'r', data: {name: 'name'}, paramKeys: ['name']},
        {direction: 'out', identifier: 'r', types: ['ONE', 'TWO']},
        'r',
        {source: 'a', direction: 'out', type: 'PLAYED_IN', target: {identifier: 'm', label: 'Movie'}}
      ];

      patterns.forEach(function(pattern, i) {
        assert.strictEqual(helpers.relationshipPattern(descriptors[i]), pattern);
      });
    });
  });

  describe('Search pattern', function() {

    it('should throw if the given query is not a string.', function() {
      assert.throws(function() {
        helpers.searchPattern({hello: 'world'});
      }, /query/);
    });

    it('should throw if the passed flags are invalid.', function() {
      assert.throws(function() {
        helpers.searchPattern('john', {flags: 'bmx'});
      }, /invalid flags/);
    });

    it('should properly build relationship patterns.', function() {
      var patterns = [
        '(?ius).*john.*',
        '(?i).*john.*',
        'john',
        '(?u)john'
      ];

      var descriptors = [
        {},
        {flags: 'i'},
        {flags: '', partial: false},
        {flags: 'u', partial: false}
      ];

      patterns.forEach(function(pattern, i) {
        assert.strictEqual(helpers.searchPattern('john', descriptors[i]), pattern, '"' + pattern + '"');
      });
    });
  });
});
