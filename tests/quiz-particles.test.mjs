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

test('perfect particle burst adds phased overdrive layers', async () => {
  const source = await readFile(
    new URL('../src/components/ParticleBurst.svelte', import.meta.url),
    'utf8'
  );

  assert.match(
    source,
    /{#if perfect}[\s\S]*class="perfect-overdrive"/,
    'perfect score should render a dedicated overdrive layer'
  );
  assert.match(source, /class="shockwave"/, 'perfect overdrive should include shockwave rings');
  assert.match(source, /class="beam"/, 'perfect overdrive should include rotating light beams');
  assert.match(source, /class="comet"/, 'perfect overdrive should include radial comets');
  assert.match(
    source,
    /class="confetti-shard"/,
    'perfect overdrive should include delayed confetti shards'
  );
  assert.match(source, /@keyframes shockwave-pulse/, 'shockwave phase should be animated');
  assert.match(source, /@keyframes comet-launch/, 'comet phase should be animated');
  assert.match(source, /@keyframes confetti-fall/, 'confetti phase should be animated');
});

test('perfect score generates a denser particle field', () => {
  assert.match(
    quizPanelSource,
    /const count = kind === 'perfect' \? 220 : 30;/,
    'perfect score should use a much denser particle field than modest celebrations'
  );
});

test('perfect animation debug trigger is development-only', () => {
  assert.match(
    quizPanelSource,
    /const showPerfectDebug = import\.meta\.env\.DEV;/,
    'debug trigger should use the build-mode development flag'
  );
  assert.match(
    quizPanelSource,
    /function showPerfectDebugResult\(\)[\s\S]*score = 100;[\s\S]*celebration = 'perfect';[\s\S]*particles = makeParticles\('perfect'\);/,
    'debug trigger should jump directly to the perfect result animation'
  );
  assert.match(
    quizPanelSource,
    /{#if showPerfectDebug}[\s\S]*class="perfect-debug-button"[\s\S]*on:click=\{showPerfectDebugResult\}/,
    'debug button should render only when the development flag is true'
  );
});
