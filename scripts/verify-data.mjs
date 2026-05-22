import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'smol-toml';
import ts from 'typescript';

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
    if ('artist' in fortune) {
      assert.equal(typeof fortune.artist, 'string', `fortune ${index + 1} artist must be a string`);
    }
    if ('artist_link' in fortune) {
      assert.equal(
        typeof fortune.artist_link,
        'string',
        `fortune ${index + 1} artist_link must be a string`
      );
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

async function importTypescriptModule(path) {
  const source = readFileSync(path, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}

async function verifyQuizGenerator() {
  const quiz = await importTypescriptModule('src/data/quiz-generator.ts');
  const lyricsSource = readFileSync('src/data/lyrics.txt', 'utf8');
  const distractorsSource = readFileSync('src/data/lyric-distractors.txt', 'utf8');

  const parsed = quiz.parseQuizSources(lyricsSource, distractorsSource);
  assert.equal(parsed.lyrics.length, 94, 'quiz lyrics should include every non-empty line');
  assert.equal(parsed.lyrics[32].text, '宇宙冷漠', 'trailing * should be stripped');
  assert.equal(parsed.lyrics[32].singer, 'kakaa', 'trailing * should mark Kakaa lines');
  assert.equal(parsed.lyrics[17].text, '芜~', 'trailing ~ should be preserved');
  assert.ok(parsed.targets.length > 0, 'quiz should have selectable lyric targets');

  const rolls = [0.01, 0.23, 0.47, 0.71, 0.89, 0.34, 0.58, 0.92];
  let rollIndex = 0;
  const random = () => {
    const value = rolls[rollIndex % rolls.length];
    rollIndex += 1;
    return value;
  };

  const generated = quiz.generateQuiz(parsed, random);
  assert.equal(generated.length, 10, 'quiz should contain exactly 10 questions');

  for (const [index, question] of generated.entries()) {
    assert.equal(question.options.length, 4, `question ${index + 1} should have four options`);
    assert.equal(
      question.options.filter((option) => option.correct).length,
      1,
      `question ${index + 1} should have exactly one correct option`
    );
    if (index < 9) {
      assert.equal(
        question.options[0].text,
        '宇宙冷漠',
        `question ${index + 1} should keep option A as the joke answer`
      );
    }
  }

  const seededRandom = (seed) => {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  };

  const badMarkerAnswer = Array.from({ length: 1000 }, (_, seed) =>
    quiz.generateQuiz(parsed, seededRandom(seed + 1)).at(-1)
  ).find(
    (question) =>
      question?.prompt === '以下哪一句歌词的上一句是“芜~”？' &&
      question.options.some((option) => option.correct && option.text === '芜~ / 无边的黑暗')
  );

  assert.equal(
    badMarkerAnswer,
    undefined,
    'marker questions should disambiguate duplicate answer lyrics away from the marker prompt'
  );
}

verifyFortunes();
verifyQuizResultComments();
await verifyQuizGenerator();
