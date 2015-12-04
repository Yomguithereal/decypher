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
    batch.relate(45, 'AGGREGATES', cheese);

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
        'SET ne45 += {pe45}',
        'CREATE (ni0 {pi0})',
        'SET ni0:`ClassifiedItem`',
        'SET ni0:`ClassifiedProduct`',
        'CREATE (ni1 {pi1})',
        'SET ni1:`Item`',
        'CREATE (ni2 {pi2})',
        'SET ni2:`Item`',
        'DELETE r0',
        'CREATE (ni0)-[:AGGREGATES]->(ni1)',
        'CREATE (ni0)-[:AGGREGATES]->(ni2)',
        'CREATE (ne45)-[:AGGREGATES]->(ni2)'
      ]
    );

    assert.deepEqual(
      query.params(),
      {
        pe45: {note: 'Here you go.'},
        pi0: {name: 'Dairy products'},
        pi1: {name: 'Milk'},
        pi2: {name: 'Cheese'}
      }
    );
  });
});
