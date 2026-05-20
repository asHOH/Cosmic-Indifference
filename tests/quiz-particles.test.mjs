import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const quizPanelSource = await readFile(
  new URL('../src/components/QuizPanel.svelte', import.meta.url),
  'utf8'
);

test('quiz panel delegates particle effects to focused components', () => {
  assert.match(
    quizPanelSource,
    /import AnswerSparkle from '\.\/AnswerSparkle\.svelte';/,
    'QuizPanel should import the correct-answer sparkle component'
  );
  assert.match(
    quizPanelSource,
    /import ParticleBurst from '\.\/ParticleBurst\.svelte';/,
    'QuizPanel should import the result celebration particle component'
  );
  assert.match(
    quizPanelSource,
    /<AnswerSparkle\s*\/>/,
    'QuizPanel should render answer sparkle through the extracted component'
  );
  assert.match(
    quizPanelSource,
    /<ParticleBurst\s+particles=\{visibleParticles\}\s+perfect=\{celebration === 'perfect'\}/,
    'QuizPanel should render celebration particles through the extracted component'
  );
});

test('answer sparkle component owns lightweight correct-answer particles', async () => {
  const source = await readFile(
    new URL('../src/components/AnswerSparkle.svelte', import.meta.url),
    'utf8'
  );

  assert.match(
    source,
    /class="answer-correct-particles"[\s\S]*class="answer-correct-particle"/,
    'answer sparkle should render lightweight particle spans'
  );
  assert.match(
    source,
    /@keyframes correct-answer-particle/,
    'answer sparkle should own the correct-answer particle animation'
  );
});

test('particle burst component owns result celebration field animation', async () => {
  const source = await readFile(
    new URL('../src/components/ParticleBurst.svelte', import.meta.url),
    'utf8'
  );

  assert.match(
    source,
    /class="celebration-field"/,
    'particle burst should render the celebration field'
  );
  assert.match(
    source,
    /@keyframes particle-burst/,
    'particle burst should own the burst animation'
  );
});
