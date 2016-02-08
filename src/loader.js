/**
 * Decypher Loader
 * ================
 *
 * Simple function designed to read external cypher files à la yesql so the
 * queries can be used easily within code afterwards.
 */
var fs = require('fs'),
    path = require('path'),
    isPlainObject = require('./utils.js').isPlainObject;

/**
 * Helpers.
 */
function parseBlock(block) {
  var data = {body: ''};

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

function parse(string) {
  var blocks;

  if (~string.search(/\/\/\s?name:/i))
    blocks = string.split(/(?=\/\/\s+name:)/ig);
  else
    blocks = [string];

  return blocks.map(parseBlock);
}

function resolve(string, pathname) {
  var blocks = parse(string);

  if (blocks.length <= 1 && !blocks[0].name) {
    return blocks[0].body;
  }
  else {
    var o = {};
    blocks.forEach(function(b, i) {
      if (o[b.name])
        throw Error('decypher: twice the name "' + b.name + '" in file "' + pathname + '".');

      o[b.name || i] = b.body;
    });

    return o;
  }
}

/**
 * Main function.
 */
function loader(spec, extension) {
  var o = {};

  extension = (extension || 'cypher').replace(/^\./, '');

  if (typeof spec === 'string') {

    // Folder-behaviour
    if (fs.lstatSync(spec).isDirectory()) {
      var r = new RegExp('(.*)\\.' + extension + '$');

      o = {};

      fs.readdirSync(spec)
        .filter(function(filename) {
          return fs.lstatSync(path.join(spec, filename)).isFile() &&
                 ~filename.search(r);
        })
        .forEach(function(filename) {
          var p = path.join(spec, filename);
          o[filename.match(r)[1]] = resolve(fs.readFileSync(p, 'utf-8'), p);
        });

      return o;
    }
    else {
      return resolve(fs.readFileSync(spec, 'utf-8'), spec);
    }
  }
  else if (isPlainObject(spec)) {
    o = {};

    for (var k in spec) {
      o[k] = resolve(fs.readFileSync(spec[k], 'utf-8'), spec[k]);
    }
    return o;
  }

  throw Error('decypher: argument must be path or object of paths.');
}

// Exposing the parser
loader.parse = parse;

// Exporting
module.exports = loader;
