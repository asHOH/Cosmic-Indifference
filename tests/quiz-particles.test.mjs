import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const quizPanelSource = await readFile(
  new URL('../src/components/QuizPanel.svelte', import.meta.url),
  'utf8'
);
const particleBurstSource = await readFile(
  new URL('../src/components/ParticleBurst.svelte', import.meta.url),
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
  assert.match(
    particleBurstSource,
    /class="celebration-field"/,
    'particle burst should render the celebration field'
  );
  assert.match(
    particleBurstSource,
    /@keyframes particle-burst/,
    'particle burst should own the burst animation'
  );
});

test('perfect particle burst adds phased overdrive layers', async () => {
  assert.match(
    particleBurstSource,
    /{#if perfect}[\s\S]*class="perfect-overdrive"/,
    'perfect score should render a dedicated overdrive layer'
  );
  assert.match(
    particleBurstSource,
    /class="shockwave"/,
    'perfect overdrive should include shockwave rings'
  );
  assert.match(
    particleBurstSource,
    /class="beam"/,
    'perfect overdrive should include rotating light beams'
  );
  assert.match(
    particleBurstSource,
    /class="comet"/,
    'perfect overdrive should include radial comets'
  );
  assert.match(
    particleBurstSource,
    /class="confetti-shard"/,
    'perfect overdrive should include delayed confetti shards'
  );
  assert.match(
    particleBurstSource,
    /@keyframes shockwave-pulse/,
    'shockwave phase should be animated'
  );
  assert.match(particleBurstSource, /@keyframes comet-launch/, 'comet phase should be animated');
  assert.match(
    particleBurstSource,
    /@keyframes confetti-fall/,
    'confetti phase should be animated'
  );
});

test('perfect score generates a denser particle field', () => {
  assert.match(
    quizPanelSource,
    /particles = celebration === 'modest' \? makeParticles\(\) : \[\];/,
    'perfect score should leave cup particles to the canvas confetti launcher'
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
    /function showPerfectDebugResult\(\)[\s\S]*score = 100;[\s\S]*celebration = 'perfect';[\s\S]*particles = \[\];/,
    'debug trigger should jump directly to the perfect result animation'
  );
  assert.match(
    quizPanelSource,
    /{#if showPerfectDebug}[\s\S]*class="perfect-debug-button"[\s\S]*on:click=\{showPerfectDebugResult\}/,
    'debug button should render only when the development flag is true'
  );
});

test('perfect cup burst is delegated to canvas confetti', () => {
  assert.match(
    particleBurstSource,
    /import { onDestroy, onMount } from 'svelte';/,
    'confetti should be launched only from client lifecycle hooks'
  );
  assert.match(
    particleBurstSource,
    /import\('canvas-confetti'\)/,
    'canvas-confetti should be loaded dynamically on the client'
  );
  assert.match(
    particleBurstSource,
    /function launchPerfectConfetti\(\)[\s\S]*fireCupConfetti\(\{[\s\S]*particleCount:\s*120,[\s\S]*spread:\s*92,[\s\S]*startVelocity:\s*76,[\s\S]*gravity:\s*1\.12,[\s\S]*origin:\s*{ x: 0\.5, y: 0\.48 }/,
    'perfect cup burst should use high-velocity gravity-aware canvas confetti'
  );
  assert.match(
    particleBurstSource,
    /setTimeout\(\(\) =>[\s\S]*fireCupConfetti\(\{[\s\S]*origin:\s*{ x: 0\.46, y: 0\.48 }[\s\S]*\}\);[\s\S]*},\s*180\)/,
    'perfect cup burst should include a delayed second burst'
  );
  assert.match(
    particleBurstSource,
    /{#if particles\.length > 0 && !perfect}/,
    'perfect score should not render the old DOM particle field'
  );
  assert.doesNotMatch(
    particleBurstSource,
    /@keyframes perfect-particle-burst/,
    'old segmented perfect keyframes should be removed'
  );
});

test('perfect ceiling rainbow effect is denser and faster', () => {
  assert.match(
    particleBurstSource,
    /const confettiShards = Array\.from\({ length: 108 }/,
    'perfect ceiling rainbow should use more shards'
  );
  assert.match(
    particleBurstSource,
    /delay:\s*340 \+ \(id % 24\) \* 24,/,
    'perfect ceiling rainbow should have a tighter stagger'
  );
  assert.match(
    particleBurstSource,
    /duration:\s*1650 \+ \(id % 7\) \* 115,/,
    'perfect ceiling rainbow should remain visible long enough to feel dense'
  );
});
