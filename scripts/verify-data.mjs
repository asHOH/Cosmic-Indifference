import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'smol-toml';

const scoreBuckets = ['0-50', '60', '70', '80', '90', '100'];

function readToml(path) {
  return parse(readFileSync(path, 'utf8'));
}

function verifyFortunes() {
  const data = readToml('src/data/fortunes.toml');
  assert.ok(Array.isArray(data.fortunes), 'fortunes.toml must contain [[fortunes]] entries');
  assert.ok(data.fortunes.length > 0, 'fortunes.toml must contain at least one fortune');

  for (const [index, fortune] of data.fortunes.entries()) {
    assert.equal(typeof fortune.name, 'string', `fortune ${index + 1} needs a string name`);
    assert.equal(typeof fortune.color, 'string', `fortune ${index + 1} needs a string color`);
    if ('comment' in fortune) {
      assert.equal(
        typeof fortune.comment,
        'string',
        `fortune ${index + 1} comment must be a string`
      );
    }
    if ('weight' in fortune) {
      assert.equal(typeof fortune.weight, 'number', `fortune ${index + 1} weight must be a number`);
      assert.ok(fortune.weight > 0, `fortune ${index + 1} weight must be positive`);
    }
  }
}

function verifyQuizResultComments() {
  const data = readToml('src/data/quiz-result-comments.toml');

  for (const bucket of scoreBuckets) {
    const comments = data[bucket]?.comments;
    assert.ok(Array.isArray(comments), `bucket ${bucket} must define comments`);
    assert.ok(comments.length >= 3, `bucket ${bucket} must contain at least 3 comments`);
    for (const comment of comments) {
      assert.equal(typeof comment, 'string', `bucket ${bucket} comments must be strings`);
    }
  }
}

verifyFortunes();
verifyQuizResultComments();
