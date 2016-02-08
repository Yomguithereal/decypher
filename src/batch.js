/**
 * Decypher Batch
 * ===============
 *
 * Simple cypher batch abstraction used to save and relate series of nodes.
 */
var utils = require('./utils.js'),
    isPlainObject = utils.isPlainObject,
    assign = utils.assign,
    Query = require('./query.js'),
    helpers = require('./helpers.js');

var escapeIdentifier = helpers.escapeIdentifier,
    nodePattern = helpers.nodePattern,
    relationshipPattern = helpers.relationshipPattern;

/**
 * Helpers.
 */
function buildObject(key, value) {
  if (!key)
    return null;

  var o = {};
  o[key] = value;
  return o;
}

function validData(o) {
  return o && !!Object.keys(o).length;
}

/**
 * Handler classes.
 */
function Node(batch, id, data, labels) {

  var external = id || id === 0;

  // Properties
  this.batch = batch;
  this.id = id || null;
  this.identifier = 'N' + (!external ? 'i' + (batch.nodesCounter++) : 'e' + id);
  this.param = 'p' + this.identifier;
  this.data = data || null;
  this.labels = labels;
  this.external = external;
}

function Edge(batch, id, source, predicate, target, data) {

  var external = id || id === 0;

  // Properties
  this.batch = batch;
  this.id = id || null;
  this.identifier = 'R' + (!external ? 'i' + (batch.edgesCounter++) : 'e' + id);
  this.param = 'p' + this.identifier;
  this.source = source;
  this.target = target;
  this.predicate = predicate;
  this.data = data || null;
  this.external = external;
}

/**
 * Main class.
 */
function Batch() {

  // Counters & indexes
  this.nodesCounter = 0;
  this.edgesCounter = 0;
  this.nodes = {};
  this.externalNodes = {};
  this.edges = [];
  this.unlinks = [];
}

/**
 * Private prototype.
 */
Batch.prototype._externalNode = function(id) {
  if (typeof id !== 'string' && typeof id !== 'number')
    throw Error('decypher.Batch: invalid node. Should be either a node handler or a raw Neo4j id.');

  if (!this.externalNodes[id])
    this.externalNodes[id] = new Node(this, id, {});

  return this.externalNodes[id];
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
  var node = new Node(this, null, data, labels);
  this.nodes[node.identifier] = node;

  return node;
};

// Updating a node
Batch.prototype.update = function(node, data) {
  if (!isPlainObject(data))
    throw Error('decypher.Batch.update: provided data is not an object.');

  if (!(node instanceof Node))
    node = this._externalNode(node);

  node.data = assign({}, node.data, data);

  return node;
};

// Setting a property
// Batch.prototype.set = function(id, key, value) {

// };

// Removing a property
// Batch.prototype.remove = function(id, key) {

// };

// Relate two nodes
Batch.prototype.relate = function(source, predicate, target, data) {
  data = data || null;

  if (!(source instanceof Node))
    source = this._externalNode(source);

  if (!(target instanceof Node))
    target = this._externalNode(target);

  var edge = new Edge(this, null, source, predicate, target, data);

  this.edges.push(edge);

  return edge;
};

// Unrelate two nodes
// TODO: how to delete a relation strictly
Batch.prototype.unrelate = function(source, predicate, target) {

  if (!(source instanceof Node))
    source = this._externalNode(source);

  if (!(target instanceof Node))
    target = this._externalNode(target);

  this.unlinks.push({source: source, target: target, predicate: predicate});
  return;
};

Batch.prototype.delete = function() {

};

Batch.prototype.query = function() {
  var query = new Query(),
      matchSegment = query.segment(),
      createSegment = query.segment();


  //-- Registering external nodes
  Object.keys(this.externalNodes).forEach(function(k) {
    var node = this.externalNodes[k];

    matchSegment
      .match(nodePattern({identifier: node.identifier}))
      .where('id(' + node.identifier + ') = ' + node.id);

    if (validData(node.data))
      query.set(node.identifier + ' += {' + node.param + '}', buildObject(node.param, node.data));
  }, this);

  //-- Internal nodes
  Object.keys(this.nodes).forEach(function(k) {
    var node = this.nodes[k];

    createSegment
      .create(nodePattern({identifier: node.identifier, data: node.param}), buildObject(node.param, node.data));

    var labels = node.labels.map(function(label) {
      return node.identifier + ':' + escapeIdentifier(label);
    });

    query.set(labels);
  }, this);

  //-- Unlinks
  this.unlinks.forEach(function(unlink, i) {
    matchSegment
      .match(relationshipPattern({
        direction: 'out',
        identifier: 'U' + i,
        predicate: unlink.predicate,
        source: unlink.source.identifier,
        target: unlink.target.identifier
      }));

    query.delete('U' + i);
  });

  //-- Edges
  this.edges.forEach(function(edge) {
    createSegment
      .create(relationshipPattern({
        direction: 'out',
        predicate: edge.predicate,
        data: edge.data ? edge.param : null,
        source: edge.source.identifier,
        target: edge.target.identifier
      }));

    if (validData(edge.data))
      query.params(buildObject(edge.param, edge.data));
  });

  return query;
};

Batch.prototype.build = function() {
  return this.query().build();
};

module.exports = Batch;
