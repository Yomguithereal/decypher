/* eslint no-unused-vars: 0 */
/**
 * Decypher Batch
 * ===============
 *
 * Simple cypher batch abstraction used to save and relate series of nodes.
 */
var MultiDirectedGraph = require('graphology').MultiDirectedGraph,
    Query = require('./query.js'),
    helpers = require('./helpers.js'),
    utils = require('./utils.js');

// node or relationship can be created node ref. int or string, predicate (possibility to pass custom where) {labels?, where, properties, source, target}

// TODO: optimize the query
// TODO: static method on batches for one-shot
// #.createNode(label, map)
// #.createRelationship(type, fromNode, toNode, map)
// #.deleteNode(node)
// #.deleteRelationship(relationship)
// #.updateNodeProperties(node, map)
// #.updateRelationshipProperties(relationship, map)
// #.setNodeProperty
// #.setRelationshipProperty
// #.removeNodeProperty
// #.setNodeProperty
// #.removeNodeLabel
// #.addNodeLabel

/**
 * Reference classes.
 */
function BatchNode(identifier) {
  this.identifier = identifier;
}

BatchNode.prototype.toString = function() {
  return this.identifier;
};

function BatchRelationship(identifier) {
  this.identifier = identifier;
}

BatchRelationship.prototype.toString = function() {
  return this.identifier;
};

/**
 * Helpers.
 */
function createIncrementalId() {
  var id = 0;

  return function() {
    return id++;
  };
}

// Testing the string so we don't interpolate things that are not an id.
var ID_REGEX = /^\d+/g;

function isValidNodeRepresentation(representation) {
  return (
    (typeof representation === 'string' && ID_REGEX.test(representation)) ||
    typeof representation === 'number' ||
    representation instanceof BatchNode ||
    utils.isPlainObject(representation)
  );
}

function isValidRelationshipRepresentation(representation) {
  return (
    (typeof representation === 'string' && ID_REGEX.test(representation)) ||
    typeof representation === 'number' ||
    representation instanceof BatchRelationship ||
    utils.isPlainObject(representation)
  );
}

/**
 * Hash functions.
 */
function newNodeIdentifier(id) {
  return 'nN' + id;
}

function newNodePropsIdentifier(id) {
  return 'nNP' + id;
}

function existingNodeIdentifier(id) {
  return 'eN' + id;
}

function newEdgeIdentifier(id) {
  return 'nE' + id;
}

function newEdgePropsIdentifier(id) {
  return 'nEP' + id;
}

function existingEdgeIdentifier(id) {
  return 'eE' + id;
}

function hashLabels(labels) {
  return labels.join('§');
}

/**
 * Batch main class.
 */
function Batch() {

  if (!(this instanceof Batch))
    return new Batch();

  // Properties
  this.graph = new MultiDirectedGraph();
  this.generateNodeId = createIncrementalId();
  this.generateEdgeId = createIncrementalId();
}

/**
 * Internal node resolution.
 */
Batch.prototype.resolveNode = function(caller, representation) {

  // BatchNode reference:
  if (representation instanceof BatchNode) {
    if (!this.graph.hasNode(representation))
      throw new Error('decypher.Batch.' + caller + ': could not find given node in internal graph. This reference probably belongs to another batch.');

    return representation.identifier;
  }

  // Existing node
  if (typeof representation === 'string' ||
      typeof representation === 'number') {
    var identifier = existingNodeIdentifier(representation);

    if (!this.graph.hasNode(identifier))
      this.graph.addNode(identifier, {
        id: representation,
        existing: true
      });

    return identifier;
  }
};

/**
 * Creating a node.
 */
Batch.prototype.createNode = function(labelOrLabels, properties) {
  var labels = [];

  if (labelOrLabels)
    labels = labels.concat(labelOrLabels);

  if (properties && !utils.isPlainObject(properties))
    throw new Error('decypher.Batch.createNode: invalid properties. Expecting a plain object.');

  var id = this.generateNodeId(),
      identifier = newNodeIdentifier(id);

  this.graph.addNode(identifier, {
    id: id,
    existing: false,
    properties: properties || {},
    labels: labels
  });

  return new BatchNode(identifier);
};

/**
 * Creating a relationship.
 */
Batch.prototype.createRelationship = function(type, source, target, properties) {
  if (typeof type !== 'string')
    throw new Error('decypher.Batch.createRelationship: invalid relationship type. Expecting a string.');

  if (!isValidNodeRepresentation(source))
    throw new Error('decypher.Batch.createRelationship: invalid source node. Expecting a Neo4j id, a node\'s reference in the batch or a predicate.');

  if (!isValidNodeRepresentation(target))
    throw new Error('decypher.Batch.createRelationship: invalid target node. Expecting a Neo4j id, a node\'s reference in the batch or a predicate.');

  if (properties && !utils.isPlainObject(properties))
    throw new Error('decypher.Batch.createRelationship: invalid properties. Expecting a plain object.');

  var id = this.generateEdgeId(),
      identifier = newEdgeIdentifier(id);

  var sourceIdentifier = this.resolveNode('createRelationship', source),
      targetIdentifier = this.resolveNode('createRelationship', target);

  this.graph.addEdgeWithKey(
    identifier,
    sourceIdentifier,
    targetIdentifier,
    {
      id: id,
      existing: false,
      type: type,
      properties: properties || {}
    }
  );

  return new BatchRelationship(identifier);
};

/**
 * Deleting a node.
 */
Batch.prototype.deleteNode = function(representation) {

  if (!isValidNodeRepresentation(representation))
    throw new Error('decypher.Batch.deleteNode: invalid source node. Expecting a Neo4j id, a node\'s reference in the batch or a predicate.');

  // If the node exists in the graph, we just drop it from internal graph
  if (representation instanceof BatchNode) {
    if (!this.graph.hasNode(representation))
      throw new Error('decypher.Batch.deleteNode: could not find given node in internal graph. This reference probably belongs to another batch.');
    this.graph.dropNode(representation);
  }

  // If we are targeting an external node
  else if (
    typeof representation === 'string' ||
    typeof representation === 'number'
  ) {

    var identifier = existingNodeIdentifier(representation);

    if (!this.graph.hasNode(identifier))
      this.graph.addNode(identifier, {
        id: representation,
        existing: true,
        toDelete: true
      });

    // Dropping potential added edges
    this.graph.dropEdges(this.graph.edges(identifier));
  }

  return this;
};

/**
 * Building the batch's query.
 */
Batch.prototype.query = function() {
  var graph = this.graph;

  var query = new Query(),
      matchSegment = query.segment(),
      createSegment = query.segment(),
      deleteSegment = query.segment(),
      updateSegment = query.segment(),
      nodesToCreate = [],
      nodesToDelete = [],
      relationshipsToCreate = [];

  var params = {};

  var nodes = graph.nodes(),
      edges = graph.edges();

  var node,
      edge,
      source,
      target,
      pattern,
      attr,
      propsIdentifier,
      i,
      l;

  for (i = 0, l = nodes.length; i < l; i++) {
    node = nodes[i];
    attr = graph.getNodeAttributes(node);

    if (!attr.existing) {
      propsIdentifier = newNodePropsIdentifier(attr.id);
      pattern = {
        identifier: node,
        labels: attr.labels
      };

      if (Object.keys(attr.properties).length) {
        pattern.data = propsIdentifier;
        params[propsIdentifier] = attr.properties;
      }

      nodesToCreate.push(helpers.nodePattern(pattern));
    }
    else {

      // First we need to match the node in the graph
      if (
        graph.degree(node) > 0 ||
        attr.toDelete
      ) {
        matchSegment.match(helpers.nodePattern(node));
        matchSegment.where('id(' + node + ') = ' + attr.id);
      }

      // Do we need to delete it?
      if (attr.toDelete)
        nodesToDelete.push(node);
    }
  }

  for (i = 0, l = edges.length; i < l; i++) {
    edge = edges[i];
    source = graph.source(edge);
    target = graph.target(edge);
    attr = graph.getEdgeAttributes(edge);

    if (!attr.existing) {
      propsIdentifier = newEdgePropsIdentifier(attr.id);
      pattern = {
        direction: 'out',
        source: source,
        target: target,
        type: attr.type
      };

      if (Object.keys(attr.properties).length) {
        pattern.data = propsIdentifier;
        params[propsIdentifier] = attr.properties;
      }

      relationshipsToCreate.push(helpers.relationshipPattern(pattern));
    }
  }

  if (nodesToCreate.length)
    createSegment.create(nodesToCreate);

  if (relationshipsToCreate.length)
    createSegment.create(relationshipsToCreate);

  if (nodesToDelete.length)
    deleteSegment.detachDelete(nodesToDelete);

  query.params(params);

  return query;
};

/**
 * Bootstrapping some of the query's method for convenience.
 */
Batch.prototype.statements = function() {
  return this.query().statements();
};

Batch.prototype.params = function() {
  return this.query().params();
};

Batch.prototype.compile = function() {
  return this.query().compile();
};
Batch.prototype.toString = Batch.prototype.compile;

Batch.prototype.build = function() {
  return this.query().build();
};

/**
 * Exporting.
 */
module.exports = Batch;
