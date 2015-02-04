/**
 * Decypher
 * =========
 *
 * Simple node module designed to fetch external cypher query files in order to
 * load them for later use.
 */
var fs = require('fs');

// Helpers
function isPlainObject(v) {
  return v instanceof Object &&
         !(v instanceof Array) &&
         !(v instanceof Function);
}

function parse(string) {
  var blocks;

  if (~string.search(/\/\/\s?name:/i))
    blocks = string.split(/(?=\/\/\s+name:)/ig);
  else
    blocks = [string];

  return blocks.map(parseBlock);
}

function parseBlock(block) {
  var data = {body: ''};

  // Iterating through lines
  block.trim().split(/[\n\r]+/g).forEach(function(line) {
    var l = line.trim();

    var nm = line.match(/\/\/\s+name:(.*)/i);

    // Name
    if (nm)
      data.name = nm[1].trim();

    // Body
    l = l.replace(/(\/\/.*)/, '').trim();
    if (l)
      data.body += (data.body ? '\n' : '') + l;
  });

  return data;
}

function resolve(string, path) {
  var blocks = parse(string);

  if (blocks.length <= 1 && !blocks[0].name) {
    return blocks[0].body;
  }
  else {
    var o = {};
    blocks.forEach(function(b, i) {
      if (o[b.name])
        throw Error('decypher: twice the name "' + b.name + '" in file "' + path + '".');

      o[b.name || i] = b.body;
    });

    return o;
  }
}

// Main function
function decypher(spec, encoding) {

  if (typeof spec === 'string') {
    return resolve(fs.readFileSync(spec, 'utf-8'), spec);
  }
  else if (isPlainObject(spec)) {
    var o = {};
    for (var k in spec) {
      o[k] = resolve(fs.readFileSync(spec[k], 'utf-8'), spec[k]);
    }
    return o;
  }

  throw Error('decypher: argument must be path or object of paths.');
}

// Version
Object.defineProperty(decypher, 'version', {
  value: '0.1.1'
});

decypher.parse = parse;

// Exporting
module.exports = decypher;
