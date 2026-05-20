import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function loadQuizGenerator() {
  const source = await readFile(new URL('../src/data/quiz-generator.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function queuedRandom(values, fallback = seededRandom(1)) {
  const queue = [...values];
  return () => (queue.length > 0 ? queue.shift() : fallback());
}

test('lyric memory questions skip tilde interjections when looking for neighboring lyrics', async () => {
  const { generateQuiz, parseQuizSources } = await loadQuizGenerator();
  const lyrics = await readFile(new URL('../src/data/lyrics.txt', import.meta.url), 'utf8');
  const distractors = await readFile(
    new URL('../src/data/lyric-distractors.txt', import.meta.url),
    'utf8'
  );
  const parsed = parseQuizSources(lyrics, distractors);
  const officialTargets = parsed.targets.filter((lyric) => !lyric.background);
  const targetIndex = officialTargets.findIndex((lyric) => lyric.text === '崩溃的东西');

  assert.notEqual(targetIndex, -1, 'fixture should contain 崩溃的东西 as an official target');

  const targetRoll = (targetIndex + 0.1) / officialTargets.length;
  const [nextQuestion] = generateQuiz(parsed, queuedRandom([targetRoll, 0.25]));
  const [previousQuestion] = generateQuiz(parsed, queuedRandom([targetRoll, 0.75]));

  assert.equal(nextQuestion.kind, 'lyric');
  assert.equal(nextQuestion.prompt, '“最 最能够让人” / ________');
  assert.equal(nextQuestion.answer, '崩溃的东西');
  assert.equal(nextQuestion.options.find((option) => option.correct)?.text, '崩溃的东西');

  assert.equal(previousQuestion.kind, 'lyric');
  assert.equal(previousQuestion.prompt, '________ / “其实就是 / 宇宙冷漠”');
  assert.equal(previousQuestion.answer, '崩溃的东西');
  assert.equal(previousQuestion.options.find((option) => option.correct)?.text, '崩溃的东西');
});
