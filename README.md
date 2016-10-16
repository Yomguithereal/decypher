[![Build Status](https://travis-ci.org/Yomguithereal/decypher.svg)](https://travis-ci.org/Yomguithereal/decypher)

# Decypher

**decypher** is a node.js library packing a handful of utilities to deal with [cypher](http://neo4j.com/developer/cypher-query-language/) queries.

It includes the following:

* A [Yesql](https://github.com/krisajenkins/yesql)-like [query loader](#query-loader).
* A [query builder](#query-builder).
* An [expression builder](#expression-builder).
* Miscellaneous [helpers](#helpers).
  * [escapeIdentifier](#identifier)
  * [escapeLiteralMap](#literal-map)
  * [nodePattern](#node-pattern)
  * [relationshipPattern](#relationship-pattern)
  * [searchPattern](#search-pattern)

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

Now that if what you want is only to parse cypher strings because you retrieved the files on your, own, you can alternatively use `decypher.parse`.

## Query builder

Note that this query builder is widely inspired by the [query-builder](https://github.com/shesek/cypher-query) package by [@shesek](https://github.com/shesek) but fixed and updated to support cypher's latest evolutions.

The result object of the builder is also made to match **@thingdom** [node-neo4j](https://github.com/thingdom/node-neo4j/tree/v2#readme) specifications for the `db.cypher` method.

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
cypher.param('whatever', 'is needed');

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

## Expression builder

The expression builder lets you build `where` expression easily:

```js
var Expression = require('decypher').Expression;

var expr = new Expression('a = b');
expr.and('c = d');

expr.compile();
// or
expr.toString();
>>> 'a = b AND c = d'

// Note that you can nest expressions:
var expr = new Expression('a = b');
expr
  .or(Expression('c = d').and('e = f'));

expr.compile();
>>> 'a = b OR (c = d AND e = f)'

expr.isEmpty();
>>> false
```

## Helpers

<em id="identifier">Escaping identifiers</em>

```js
var helpers = require('decypher').helpers;

helpers.escapeIdentifier('Complex `Identifier`');
>>> '`Complex ``Identifier```'
```

<em id="literal-map">Escaping literal maps</em>

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

<em id="node-pattern">Building node patterns</em>

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

helpers.nodePattern('n');
>>> '(n)'

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


<em id="relationship-pattern">Building relationship patterns</em>

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
//   * `source`: the source node (passed to the `nodePattern` function)
//   * `target`: the target node (passed to the `nodePattern` function)

helpers.relationshipPattern();
>>> '--'

helpers.relationshipPattern('r');
>>> '-[r]-'

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

helpers.relationshipPattern({
  direction: 'out',
  predicate: 'PLAYED_IN',
  source: 'a',
  target: {
    identifier: 'm',
    label: 'Movie'
  }
});
>>> '(a)-[:PLAYED_IN]->(m:Movie)'
```

<em id="search-pattern">Building search patterns</em>

Note that it will escape for query for regular expression use through the [`escape-regexp`](https://www.npmjs.com/package/escape-regexp) module.

```js
var helpers = require('decypher').helpers;

// Possible options are:
//   * `flags` [`'ius'`]: Flags for the regular expression.
//   * `partial` [`true`]: Should the match be partial (wrapped in `.*query.*`)?

helpers.searchPattern('john');
>>> '(?ius).*john.*'

helpers.searchPattern('john', {flags: 'im'});
>>> '(?im).*john.*'

helpers.searchPattern('john', {flags: null, partial: false});
>>> 'john'
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
