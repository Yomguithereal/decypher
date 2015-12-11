/**
 * Decypher Batch
 * ===============
 *
 * Simple cypher batch abstraction used to save and relate series of nodes.
 */
var isPlainObject = require('lodash.isplainobject'),
    assign = require('lodash.assign'),
    Query = require('./query.js'),
    helpers = require('./helpers.js');

var escapeIdentifier = helpers.escapeIdentifier,
    nodePattern = helpers.nodePattern,
    relationshipPattern = helpers.relationshipPattern;

// TODO: RETURN rather object for nodes?

/**
 * Helpers.
 */
function isInternal(id) {
  return /^i/.test('' + id);
}

function buildObject(key, value) {
  if (!key)
    return null;

  var o = {};
  o[key] = value;
  return o;
}

/**
 * Class.
 */
function Batch() {

  // Counters & indexes
  this.nodesCounter = 0;
  this.nodes = {};
  this.externalNodes = {};
  this.edges = [];
  this.unlinks = [];
}

/**
 * Private prototype.
 */
Batch.prototype._externalNode = function(id, data) {
  var identifier = 'e' + id;

  if (!this.externalNodes[identifier])
    this.externalNodes[identifier] = {id: identifier};

  if (data)
    this.externalNodes[identifier].data = data;

  return this.externalNodes[identifier];
};

/**
 * Public prototype.
 */

// Saving a node
Batch.prototype.create = function(data, labels) {
  labels = labels || [];

  if (!isPlainObject(data))
    throw Error('decypher.Batch.save: provided data is not an object.');

  // Coercing labels to array
  labels = [].concat(labels);

  // Giving an id to the created node
  var id = 'i' + (this.nodesCounter++);

  this.nodes[id] = {data: data, labels: labels};

  return id;
}

// Updating a node
Batch.prototype.update = function(id, data) {
  if (!isPlainObject(data))
    throw Error('decypher.Batch.update: provided data is not an object.');

  if (isInternal(id)) {
    var node = this.nodes[id];

    if (!node)
      throw Error('decypher.Batch.update: the given internal node id is not defined.');

    node.data = assign({}, node.data, data);
  }
  else {
    this._externalNode(id, data);
  }

  return this;
};

// Setting a property
Batch.prototype.set = function(id, key, value) {

};

// Removing a property
Batch.prototype.remove = function(id, key) {

};

// Relate two nodes
Batch.prototype.relate = function(a, predicate, b, data) {
  data = data || null;

  if (!isInternal(a)) {
    var node = this._externalNode(a);
    a = node.id;
  }
  else {
    var node = this.nodes[a];

    if (!node)
      throw Error('decypher.Batch.relate: the given internal node id for the source is not defined.');
  }

  if (!isInternal(b)) {
    var node = this._externalNode(b);
    b = node.id;
  }
  else {
    var node = this.nodes[b];

    if (!node)
      throw Error('decypher.Batch.relate: the given internal node id for the target is not defined.');
  }

  this.edges.push({from: a, to: b, predicate: predicate, data: data});

  // TODO: Return the edge id?
  return this;
};

// Unrelate two nodes
// TODO: how to delete a relation strictly
Batch.prototype.unrelate = function(a, predicate, b) {

  if (!isInternal(a)) {
    var node = this._externalNode(a);
    a = node.id;
  }
  else {
    var node = this.nodes[a];

    if (!node)
      throw Error('decypher.Batch.unrelate: the given internal node id for the source is not defined.');
  }

  if (!isInternal(b)) {
    var node = this._externalNode(b);
    b = node.id;
  }
  else {
    var node = this.nodes[b];

    if (!node)
      throw Error('decypher.Batch.unrelate: the given internal node id for the target is not defined.');
  }

  this.unlinks.push({from: a, to: b, predicate: predicate});
  return this;
};

Batch.prototype.delete = function() {

};

Batch.prototype.query = function() {
  var query = new Query(),
      matchSegment = query.segment(),
      createSegment = query.segment();


  //-- Registering external nodes
  Object.keys(this.externalNodes).forEach(function(k) {
    var node = this.externalNodes[k],
        identifier = 'n' + k,
        propName = 'np' + k;

    matchSegment
      .match(nodePattern({identifier: identifier}))
      .where('id(' + identifier + ') = ' + node.id);

    if (node.data)
      query.set(identifier + ' += {' + propName + '}', buildObject(propName, node.data));
  }, this);

  //-- Internal nodes
  Object.keys(this.nodes).forEach(function(k) {
    var node = this.nodes[k],
        identifier = 'n' + k,
        propName = 'np' + k;

    createSegment
      .create(nodePattern({identifier: identifier, data: propName}), buildObject(propName, node.data));

    var labels = node.labels.map(function(label) {
      return identifier + ':' + escapeIdentifier(label);
    });

    query.set(labels);
  }, this);

  //-- Unlinks
  this.unlinks.forEach(function(unlink, i) {
    var pattern = relationshipPattern({
      direction: 'out',
      identifier: 'r' + i,
      predicate: unlink.predicate
    });

    var fromNode = nodePattern({identifier: 'n' + unlink.from}),
        toNode = nodePattern({identifier: 'n' + unlink.to});

    matchSegment
      .match(fromNode + pattern + toNode);

    query.delete('r' + i);
  });

  //-- Edges
  this.edges.forEach(function(edge, i) {
    var propName = 'rp' + i;

    var pattern = relationshipPattern({
      direction: 'out',
      predicate: edge.predicate,
      data: edge.data ? propName : null
    });

    var fromNode = nodePattern({identifier: 'n' + edge.from}),
        toNode = nodePattern({identifier: 'n' + edge.to});

    createSegment
      .create(fromNode + pattern + toNode);

    if (edge.data)
      query.params(buildObject(propName, edge.data));
  });

  return query;
};

Batch.prototype.build = function() {
  return this.query().build();
};

module.exports = Batch;
