import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../src/components/CosmicApp.svelte', import.meta.url),
  'utf8'
);

test('video source is armed only after a first user interaction', () => {
  assert.match(
    source,
    /preload="none"/,
    'initial video markup should avoid preloading before interaction'
  );
  assert.doesNotMatch(
    source,
    /<source\s+src=/,
    'initial video markup should not expose video source tags'
  );
  assert.match(
    source,
    /function armVideoPreload\(/,
    'video preloading should be armed by an explicit helper'
  );
  assert.match(
    source,
    /addEventListener\('pointerdown',\s*handleFirstInteraction/,
    'video preload should arm on first pointer interaction'
  );
  assert.match(
    source,
    /addEventListener\('keydown',\s*handleFirstInteraction/,
    'video preload should arm on first keyboard interaction'
  );
});

test('video fit avoids two-axis overflow near the source aspect ratio', () => {
  assert.match(
    source,
    /width:\s*min\(100vw,\s*177\.777778svh\);/,
    'near-16:9 viewports should contain the video instead of overflowing both axes'
  );
  assert.match(
    source,
    /aspect-ratio:\s*16 \/ 9;/,
    'video should preserve the source aspect ratio while applying the cap'
  );
  assert.match(
    source,
    /max-width:\s*none;/,
    'video should override Tailwind Preflight max-width so horizontal overflow can render'
  );
  assert.match(
    source,
    /@media \(max-aspect-ratio:\s*40 \/ 27\)\s*\{[\s\S]*\.fortune-video\s*\{[\s\S]*width:\s*120vw;/s,
    'narrow viewports should allow horizontal-only overflow'
  );
  assert.match(
    source,
    /@media \(min-aspect-ratio:\s*32 \/ 15\)\s*\{[\s\S]*\.fortune-video\s*\{[\s\S]*width:\s*213\.333333svh;/s,
    'wide viewports should allow vertical-only overflow'
  );
  assert.match(
    source,
    /transform:\s*translate\(-50%,\s*-50%\);/,
    'bounded video should stay centered while letterboxing or cropping'
  );
  assert.doesNotMatch(
    source,
    /h-full w-full cursor-pointer object-cover/,
    'object-cover crops too much on narrow portrait viewports'
  );
});
