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
        'WHERE id(ne45) = e45',
        'MATCH (ne46)',
        'WHERE id(ne46) = e46',
        'MATCH (ne45)-[r0:AGGREGATES]->(ne46)',
        'CREATE (ni0 {npi0})',
        'CREATE (ni1 {npi1})',
        'CREATE (ni2 {npi2})',
        'CREATE (ni0)-[:AGGREGATES]->(ni1)',
        'CREATE (ni0)-[:AGGREGATES]->(ni2)',
        'CREATE (ne45)-[:AGGREGATES {rp2}]->(ni2)',
        'SET ne45 += {npe45}',
        'SET ni0:ClassifiedItem, ni0:ClassifiedProduct',
        'SET ni1:Item',
        'SET ni2:Item',
        'DELETE r0'
      ]
    );

    assert.deepEqual(
      query.params(),
      {
        npe45: {note: 'Here you go.'},
        npi0: {name: 'Dairy products'},
        npi1: {name: 'Milk'},
        npi2: {name: 'Cheese'},
        rp2: {precision: 3}
      }
    );
  });
});
