[![Build Status](https://travis-ci.org/Yomguithereal/decypher.svg)](https://travis-ci.org/Yomguithereal/decypher)

# Decypher

**decypher** is a node.js library aiming at loading [cypher](http://neo4j.com/developer/cypher-query-language/) queries from external files so you can use them later in your code.

The library's philosophy is quite similar to the Clojure [Yesql](https://github.com/krisajenkins/yesql)'s one.

## Installation

You can install **decypher** from npm likewise:

```
npm install decypher
```

or from github if you need the latest development version:

```
npm install git+https://github.com/Yomguithereal/decypher.git
```

## Usage

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

To load you queries, just require **decypher** and use it to load your queries:

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
