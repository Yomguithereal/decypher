/**
 * Decypher Syntax Constants
 * ==========================
 *
 * Compiling some information about Cypher's syntax such as statements and
 * reserved words.
 */
var flags = [
  'i',
  'x',
  'm',
  's',
  'u',
  'd'
];

var REGEX_FLAGS = {};

flags.forEach(function(flag) {
  REGEX_FLAGS[flag] = true;
});

var STATEMENTS = [
  'ASSERT',
  'CALL',
  'CASE',
  'CREATE',
  'CREATE CONSTRAINT ON',
  'CREATE INDEX ON',
  'CREATE UNIQUE',
  'DELETE',
  'DETACH DELETE',
  'DROP CONSTRAINT ON',
  'DROP INDEX ON',
  'ELSE',
  'EXPLAIN',
  'FOREACH',
  'LIMIT',
  'LOAD CSV FROM',
  'LOAD CSV WITH HEADERS FROM',
  'MATCH',
  'MERGE',
  'ON CREATE SET',
  'ON MATCH SET',
  'OPTIONAL MATCH',
  'ORDER BY',
  'PROFILE',
  'REMOVE',
  'RETURN',
  'SET',
  'SKIP',
  'START',
  'THEN',
  'UNION',
  'UNION ALL',
  'UNWIND',
  'USING INDEX',
  'WITH',
  'WHERE',
  'WHERE NOT'
];

var emptyStatements = [
  'EXPLAIN',
  'PROFILE',
  'UNION',
  'UNION ALL'
];

var EMPTY_STATEMENTS = {};

emptyStatements.forEach(function(statement) {
  EMPTY_STATEMENTS[statement] = true;
});

var KEYWORDS = {};

var additionalKeywords = [
  'AND',
  'AS',
  'ASC',
  'CONTAINS',
  'DESC',
  'ENDS',
  'FALSE',
  'FIELDTERMINATOR',
  'IS',
  'NULL',
  'OR',
  'STARTS',
  'TRUE',
  'XOR',
  'YIELD'
];

STATEMENTS.concat(additionalKeywords).forEach(function(statement) {
  statement.split(' ').forEach(function(keyword) {
    KEYWORDS[keyword] = true;
  });
});

exports.REGEX_FLAGS = REGEX_FLAGS;
exports.STATEMENTS = STATEMENTS;
exports.EMPTY_STATEMENTS = EMPTY_STATEMENTS;
exports.KEYWORDS = KEYWORDS;
