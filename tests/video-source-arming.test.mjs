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

test('video fit is capped to 10 percent overflow on each viewport edge', () => {
  assert.match(
    source,
    /width:\s*min\(120vw,\s*213\.333333svh\);/,
    'video overflow cap should allow at most 10 percent past each edge'
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
    /transform:\s*translate\(-50%,\s*-50%\);/,
    'bounded video should stay centered while letterboxing or cropping'
  );
  assert.doesNotMatch(
    source,
    /h-full w-full cursor-pointer object-cover/,
    'object-cover crops too much on narrow portrait viewports'
  );
});
