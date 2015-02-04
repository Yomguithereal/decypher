/**
 * Decypher Unit Tests
 * ====================
 *
 */
var assert = require('assert'),
    decypher = require('../decypher.js'),
    fs = require('fs'),
    parse = decypher.parse;

function load(path) {
  return fs.readFileSync(__dirname + '/resources/' + path + '.cypher', 'utf-8');
}

function parseResource(path) {
  return parse(load(path));
}

describe('decypher', function() {

  describe('parser', function() {

    it('should parse single query files.', function() {
      assert.deepEqual(
        parseResource('single'),
        [{name: 'query', body: 'MATCH (b:Book)\nRETURN b;'}]
      );
    });

    it('should parse commented files.', function() {
      assert.deepEqual(
        parseResource('commented'),
        [{name: 'single', body: 'MATCH (b:Book)\nRETURN b;'}]
      );
    });

    it('should parse lone files.', function() {
      assert.deepEqual(
        parseResource('lone'),
        [{body: 'MATCH (b:Book)\nRETURN b;'}]
      );
    });

    it('should parse multiple query files.', function() {
      assert.deepEqual(
        parseResource('multiple'),
        [
          {name: 'one', body: 'MATCH (b:Book)\nRETURN b;'},
          {name: 'two', body: 'MATCH (v:Vocabulary)\nRETURN v;'}
        ]
      );
    });
  });

  describe('api', function() {

    it('should return the query\'s body when only one query is present.', function() {
      assert.deepEqual(
        decypher(__dirname + '/resources/single.cypher'),
        {query: 'MATCH (b:Book)\nRETURN b;'}
      );

      assert.deepEqual(
        decypher(__dirname + '/resources/lone.cypher'),
        'MATCH (b:Book)\nRETURN b;'
      );
    });

    it('should return an object when multiple queries are present.', function() {
      assert.deepEqual(
        decypher(__dirname + '/resources/multiple.cypher'),
        {one: 'MATCH (b:Book)\nRETURN b;', two: 'MATCH (v:Vocabulary)\nRETURN v;'}
      );
    });

    it('should be possible to pass an object of paths.', function() {
      assert.deepEqual(
        decypher({
          single: __dirname + '/resources/single.cypher',
          multiple: __dirname + '/resources/multiple.cypher'
        }),
        {
          single: {query: 'MATCH (b:Book)\nRETURN b;'},
          multiple: {one: 'MATCH (b:Book)\nRETURN b;', two: 'MATCH (v:Vocabulary)\nRETURN v;'}
        }
      );

      assert.deepEqual(
        decypher({
          single: __dirname + '/resources/lone.cypher',
          multiple: __dirname + '/resources/multiple.cypher'
        }),
        {
          single: 'MATCH (b:Book)\nRETURN b;',
          multiple: {one: 'MATCH (b:Book)\nRETURN b;', two: 'MATCH (v:Vocabulary)\nRETURN v;'}
        }
      );
    });

    it('should throw an error when two queries have the same name in the same file.', function() {

      assert.throws(function() {
        decypher(__dirname + '/resources/double.cypher');
      }, /twice/);
    });
  });
});
