/**
 * Decypher Syntax Constants
 * ==========================
 *
 * Compiling some information about Cypher's syntax such as statements and
 * reserved words.
 */
var STATEMENTS = [
  'ASSERT',
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
  'FOREACH',
  'LIMIT',
  'LOAD CSV FROM',
  'MATCH',
  'MERGE',
  'ON CREATE SET',
  'ON MATCH SET',
  'OPTIONAL MATCH',
  'ORDER BY',
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
  'WHERE'
];

var KEYWORDS = {};

var additionalKeywords = [
  'AND',
  'AS',
  'ASC',
  'DESC',
  'ENDS',
  'FALSE',
  'IS',
  'NULL',
  'OR',
  'STARTS',
  'TRUE',
  'XOR'
];

STATEMENTS.concat(additionalKeywords).forEach(function(statement) {
  statement.split(' ').forEach(function(keyword) {
    KEYWORDS[keyword] = true;
  });
});

exports.STATEMENTS = STATEMENTS;
exports.KEYWORDS = KEYWORDS;
