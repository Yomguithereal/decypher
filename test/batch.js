/**
 * Decypher Batch Unit Tests
 * ==========================
 *
 */
var assert = require('assert'),
    Batch = require('../index.js').Batch;

describe('Batch', function() {

  it('should be possible to process coherent batches.', function() {
    var batch = new Batch();

    var dairy  = batch.create({name: 'Dairy products'}, ['ClassifiedItem', 'ClassifiedProduct']),
        milk   = batch.create({name: 'Milk'}, 'Item'),
        cheese = batch.create({name: 'Cheese'}, 'Item');

    batch.relate(dairy, 'AGGREGATES', milk);
    batch.relate(dairy, 'AGGREGATES', cheese);
    batch.relate(45, 'AGGREGATES', cheese, {precision: 3});

    batch.update(45, {note: 'Here you go.'});
    batch.unrelate(45, 'AGGREGATES', 46);

    var query = batch.query();

    assert.deepEqual(
      query.statements(),
      [
        'MATCH (ne45)',
        'WHERE id(ne45) = 45',
        'MATCH (ne46)',
        'WHERE id(ne46) = 46',
        'MATCH (ne45)-[u0:AGGREGATES]->(ne46)',
        'CREATE (ni0 {npni0})',
        'CREATE (ni1 {npni1})',
        'CREATE (ni2 {npni2})',
        'CREATE (ni0)-[:AGGREGATES]->(ni1)',
        'CREATE (ni0)-[:AGGREGATES]->(ni2)',
        'CREATE (ne45)-[:AGGREGATES {rpri2}]->(ni2)',
        'SET ne45 += {npne45}',
        'SET ni0:ClassifiedItem, ni0:ClassifiedProduct',
        'SET ni1:Item',
        'SET ni2:Item',
        'DELETE u0'
      ]
    );

    assert.deepEqual(
      query.params(),
      {
        npne45: {note: 'Here you go.'},
        npni0: {name: 'Dairy products'},
        npni1: {name: 'Milk'},
        npni2: {name: 'Cheese'},
        rpri2: {precision: 3}
      }
    );
  });
});
