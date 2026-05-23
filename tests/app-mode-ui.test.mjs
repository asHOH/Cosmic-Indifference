import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('cosmic app renders the play panel as the second app mode', async () => {
  const source = await readFile(
    new URL('../src/components/CosmicApp.svelte', import.meta.url),
    'utf8'
  );

  assert.match(source, /import PlayPanel from '\.\/PlayPanel\.svelte';/);
  assert.match(source, /appMode === 'play'[\s\S]*<PlayPanel/);
});

test('mode toggle uses app mode labels for all three destinations', async () => {
  const source = await readFile(
    new URL('../src/components/ModeToggle.svelte', import.meta.url),
    'utf8'
  );

  assert.match(source, /import type \{ AppMode \} from '\.\.\/data\/app-modes';/);
  assert.match(source, /import \{ nextModeLabels \} from '\.\.\/data\/app-modes';/);
  assert.match(source, /export let mode: AppMode;/);
  assert.match(source, /\$: label = nextModeLabels\[mode\];/);
});
