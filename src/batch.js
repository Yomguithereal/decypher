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
  var query = new Query();

  var matches = [],
      lines = [];

  //-- External nodes
  Object.keys(this.externalNodes).forEach(function(k) {
    var node = this.externalNodes[k],
        name = 'n' + k,
        propName = 'p' + k;

    matches.push({name: name, id: node.id});

    if (node.data)
      lines.push({type: 'update', name: name, propName: propName, data: node.data});
  }, this);

  //-- Internal nodes
  Object.keys(this.nodes).forEach(function(k) {
    var node = this.nodes[k],
        name = 'n' + k,
        propName = 'p' + k;

    lines.push({type: 'create', name: name, propName: propName, data: node.data});

    node.labels.forEach(function(label) {
      lines.push({type: 'label', name: name, label: label});
    });
  }, this);

  //-- Unlinks
  this.unlinks.forEach(function(unlink, i) {
    matches.push({
      from: unlink.from,
      predicate: unlink.predicate,
      to: unlink.to,
      index: i
    });

    lines.push({type: 'unrelate', index: i});
  });

  //-- Edges
  this.edges.forEach(function(edge) {
    lines.push({
      type: 'relate',
      from: edge.from,
      to: edge.to,
      predicate: edge.predicate
    });
  });

  //-- Building the query
  matches.forEach(function(match) {
    if (match.from) {
      var pattern = relationshipPattern({
        direction: 'out',
        identifier: 'r' + match.index,
        predicate: match.predicate
      });

      query.match('(n' + match.from + ')' + pattern + '(n' + match.to + ')');
    }
    else {
      query.match('(' + match.name + ')');
      query.where('id(' + match.name + ') = ' + match.id);
    }
  });

  lines.forEach(function(line) {
    var p = buildObject(line.propName, line.data);

    if (line.type === 'update') {
      query.set(line.name + ' += {' + line.propName + '}', p);
    }
    else if (line.type === 'create') {
      query.create('(' + line.name + ' {' + line.propName + '})', p);
    }
    else if (line.type === 'label') {
      query.set(line.name + ':`' + escapeIdentifier(line.label) + '`');
    }
    else if (line.type === 'relate') {
      var pattern = relationshipPattern({
        direction: 'out',
        predicate: line.predicate
      });

      query.create('(n' + line.from + ')' + pattern + '(n' + line.to + ')');
    }
    else if (line.type === 'unrelate') {
      query.delete('r' + line.index);
    }
  });

  return query;
};

Batch.prototype.build = function() {
  return this.query().build();
};

module.exports = Batch;
