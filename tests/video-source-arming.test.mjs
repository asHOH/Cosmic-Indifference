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
