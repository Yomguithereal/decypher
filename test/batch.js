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

    var dairy = batch.create({name: 'Dairy products'}, ['ClassifiedItem', 'ClassifiedProduct']),
        milk = batch.create({name: 'Milk'}, 'Item'),
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
        'MATCH (Ne45)',
        'WHERE id(Ne45) = 45',
        'MATCH (Ne46)',
        'WHERE id(Ne46) = 46',
        'MATCH (Ne45)-[U0:AGGREGATES]->(Ne46)',
        'CREATE (Ni0 {pNi0})',
        'CREATE (Ni1 {pNi1})',
        'CREATE (Ni2 {pNi2})',
        'CREATE (Ni0)-[:AGGREGATES]->(Ni1)',
        'CREATE (Ni0)-[:AGGREGATES]->(Ni2)',
        'CREATE (Ne45)-[:AGGREGATES {pRi2}]->(Ni2)',
        'SET Ne45 += {pNe45}',
        'SET Ni0:ClassifiedItem, Ni0:ClassifiedProduct',
        'SET Ni1:Item',
        'SET Ni2:Item',
        'DELETE U0'
      ]
    );

    assert.deepEqual(
      query.params(),
      {
        pNe45: {note: 'Here you go.'},
        pNi0: {name: 'Dairy products'},
        pNi1: {name: 'Milk'},
        pNi2: {name: 'Cheese'},
        pRi2: {precision: 3}
      }
    );
  });
});
