[![Build Status](https://travis-ci.org/Yomguithereal/decypher.svg)](https://travis-ci.org/Yomguithereal/decypher)

# Decypher

**decypher** is a node.js library packing a handful of utilities to deal with [cypher](http://neo4j.com/developer/cypher-query-language/) queries.

It includes the following:

* A [Yesql](https://github.com/krisajenkins/yesql)-like [query loader](#query-loader).
* A simple [query builder](#query-builder).
* Miscellaneous [helpers](#helpers).

## Installation

You can install **decypher** from npm likewise:

```
npm install decypher
```

or from github if you need the latest development version:

```
npm install git+https://github.com/Yomguithereal/decypher.git
```

## Query loader

### Query files

Write one or more cypher queries per file:

*File containing a single query*

```cypher
// Any comments...
MATCH (n)-[r]-(t)
RETURN n,r,t LIMIT 100;
```

*File containing multiple named queries*

```cypher
// name: first
// Retrieve book nodes
MATCH (b:Book)
RETURN b;

// name: second
// Retrieve vocabulary nodes
MATCH (v:Vocabulary)
RETURN v;
```

### Decyphering

Just require **decypher** and use it to load your queries:

```js
var decypher = require('decypher');

// Loading a single query
decypher('./single-query.cypher');
>>> 'MATCH (n)-[r]-(t)\nRETURN n,r,t LIMIT 100;'

// Loading multiple named queries
decypher('./multiple-queries.cypher');
>>> {
  first: 'MATCH (b:Book)\nRETURN b;',
  second: 'MATCH (v:Vocabulary)\nRETURN v;'
}

// Loading a batch of files at once
decypher({
  single: './single-query.cypher',
  multiple: './multiple-queries.cypher'
});
>>> {
  single: 'MATCH (n)-[r]-(t)\nRETURN n,r,t LIMIT 100;',
  multiple: {
    first: 'MATCH (b:Book)\nRETURN b;',
    second: 'MATCH (v:Vocabulary)\nRETURN v;'
  }
}

// Loading the content of a folder

// folder/
//   - single.cypher
//   - multiple.cypher

decypher('./folder');
>>> {
  single: 'MATCH (n)-[r]-(t)\nRETURN n,r,t LIMIT 100;',
  multiple: {
    first: 'MATCH (b:Book)\nRETURN b;',
    second: 'MATCH (v:Vocabulary)\nRETURN v;'
  }
}

// Choosing a different extension when loading a folder
decypher('./path-to-queries-folder', 'cql');
```

## Query builder

Note that this query builder is widely inspired by the [query-builder](https://github.com/shesek/cypher-query) package by [@shesek](https://github.com/shesek) but fixed and updated to support cypher's latest evolutions.

The result object of the builder is also made to match **@thingdom**'s [node-neo4j](https://github.com/thingdom/node-neo4j/tree/v2#readme) specifications for the `db.cypher` method.

```js
var Query = require('decypher').Query;

// Creating a query
var cypher = new Query()
  .match('MATCH (n:Node)')
  .where('n.title = {title}', {title: 'The best title'})
  .return('n');

// Compiling to string
cypher.compile();
// or
cypher.toString();
>>> `MATCH (n:Node)
     WHERE n.title = {title}
     RETURN n;`

// Retrieving the query's parameters
cypher.params();
>>> {
  title: 'The best title'
}

// Retrieving the query's statements as an array
cypher.statements();
>>> [
  'MATCH (n:Node)',
  'WHERE n.title = {title}',
  'RETURN n'
]

// Retrieving all of the above at once
var {query, params, statements} = cypher.build();

// Note that multi words statements like `ORDER BY` have to be written in camel-case:
cypher.orderBy('n.title');

// You can also set a bunch of params at once
cypher.params({whatever: 'is needed'});

// If you need to pass multiple query parts at once & separated by a comma
// just pass an array of strings instead of a single string.
cypher.create(['(a:Actor)', '(m:Movie)']);
>>> 'CREATE (a:Actor), (m:Movie)'

// You can also add arbitrary parts to the query if required
cypher.add('anything you want');
cypher.add('with {param}', {param: 'heart'});

// Finally, you can segment your query for convenience
var cypher = new Query(),
    start = cypher.segment(),
    end = cypher.segment();

end.return('a');
start.match('(a:Actor)');

cypher.compile();
>>> `MATCH (a:Actor)
     RETURN a;`
```

## Helpers

*Escaping identifiers*

```js
var helpers = require('decypher').helpers;

helpers.escapeIdentifier('Complex `Identifier`');
>>> '`Complex ``Identifier```'
```

*Escaping literal maps*

```js
var helpers = require('decypher').helpers;

helpers.escapeLiteralMap({
  hello: 'world',
  'complex key': 3
});
>>> '{hello: "world", `complex key`: 3}'

// Indicating parameter keys
helpers.escapeLiteralMap({
  name: 'name',
  number: 2
}, ['name']);
>>> '{name: {name}, number: 2}'
```

*Building node patterns*

```js
var helpers = require('decypher').helpers;

// Possible options are:
//   * `identifier`: a string
//   * `label`: a string
//   * `data`:
//       - if string, will produce a single parameter
//       - if object, will stringify it
//   * `paramKeys`: will be passed to escapeLiteralMap when stringifying data

helpers.nodePattern();
>>> '()'

helpers.nodePattern({
  identifier: 'n',
  label: 'Node'
});
>>> '(n:Node)'

helpers.nodePattern({
  label: 'Node',
  data: {title: 'Hello'}
});
>>> '(n:Node {title: "Hello"})'

helpers.nodePattern({
  identifier: 'n',
  data: 'paramName'
});
>>> '(n {paramName})'

helpers.nodePattern({
  label: 'Chapter',
  data: {title: 'title'},
  paramKeys: ['title']
});
>>> '(:Chapter {title: {title}})'
```


*Building relationship patterns*

```js
var helpers = require('decypher').helpers;

// Possible options are:
//   * `direction`: "in" or "out"
//   * `identifier`: a string
//   * `predicate`: a string or an array of strings
//   * `data`:
//       - if string, will produce a single parameter
//       - if object, will stringify it
//   * `paramKeys`: will be passed to escapeLiteralMap when stringifying data

helpers.relationshipPattern();
>>> '--'

helpers.relationshipPattern({
  direction: 'out',
  identifier: 'r',
  predicate: 'KNOWS'
});
>>> '-[r:KNOWS]->'

helpers.relationshipPattern({
  direction: 'in',
  predicate: ['PLAYS_IN', 'KNOWS']
});
>>> '<-[:PLAYS_IN|:KNOWS]-'

helpers.relationshipPattern({
  direction: 'in',
  identifier: 'r',
  data: 'paramName'
});
>>> '<-[r {paramName}]-'

helpers.relationshipPattern({
  predicate: 'KNOWS',
  data: {since: 1975}
});
>>> '-[:KNOWS {since: 1975}]-'
```

## Contribution

Contributions are of course more than welcome. Be sure to add and pass any relevant unit tests before submitting any code.

```bash
git clone git@github.com:Yomguithereal/decypher.git
cd decypher

# Installing dependencies
npm install

# Running unit tests
npm test
```

## Roadmap

* Some helpers
* A batch

## License

[MIT](LICENSE.txt)
