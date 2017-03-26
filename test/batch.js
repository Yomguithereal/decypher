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

  it('should be possible to build a query from a batch.', function() {
    var batch = new Batch();

    var source = batch.createNode('Developer', {name: 'Yomguithereal'}),
        target = batch.createNode('Project', {name: 'Decypher'});

    batch.createNode();

    batch.createRelationship('WORKED_ON', source, target, {year: '2017'});

    // console.log(batch.query().build());
  });
});
