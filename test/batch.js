/**
 * Decypher Batch Unit Tests
 * ==========================
 *
 */
var assert = require('assert'),
    Batch = require('../index.js').Batch;

describe('Batch', function() {

  it('should be possible to use new or not.', function() {
    assert((new Batch()) instanceof Batch);
    assert(Batch() instanceof Batch);
  });

  // TODO: test throwing

  it('should be possible to build a query from a batch.', function() {
    var batch = new Batch();

    var source = batch.createNode('Developer', {name: 'Yomguithereal'}),
        target = batch.createNode(['Project', 'Repository'], {name: 'Decypher'});

    batch.createNode();

    batch.createRelationship('WORKED_ON', source, target, {year: '2017'});
    batch.createRelationship('WORKED_ON', source, 34);

    var query = batch.query();

    assert.deepEqual(query.statements(), [
     'MATCH (eN34)',
     'WHERE id(eN34) = 34',
     'CREATE (nN0:Developer {nNP0}), (nN1:Project:Repository {nNP1}), (nN2)',
     'CREATE (nN0)-[:WORKED_ON {nEP0}]->(nN1), (nN0)-[:WORKED_ON]->(eN34)'
    ]);

    assert.deepEqual(query.params(), {
      nNP0: {name: 'Yomguithereal'},
      nNP1: {name: 'Decypher'},
      nEP0: {year: '2017'}
    });
  });

  it('should be possible to delete a node.', function() {
    var batch = new Batch();

    var willDrop = batch.createNode('Student'),
        willStay = batch.createNode('Student');

    batch.createRelationship('KNOWS', willDrop, willStay, {where: 'university'});
    batch.createRelationship('WORKED_ON', willStay, 34);

    // Dropping a newly create node will just not insert it
    batch.deleteNode(willDrop);

    // Dropping an external node will also drop new relationships
    batch.deleteNode(34);

    // Dropping and external node just works as expected
    batch.deleteNode(45);

    // We should have one node created and one deleted
    // console.log(batch.graph, batch.query());
  });
});
