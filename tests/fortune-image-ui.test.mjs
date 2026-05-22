import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function loadFortuneImages() {
  const source = await readFile(new URL('../src/data/fortune-images.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

test('fortune image path is derived from the fortune name', async () => {
  const { fortuneImagePath } = await loadFortuneImages();

  assert.equal(fortuneImagePath('开心小花'), '/fortunes/%E5%BC%80%E5%BF%83%E5%B0%8F%E8%8A%B1.webp');
});

test('fortune panel renders the revealed image before the fortune name', async () => {
  const source = await readFile(
    new URL('../src/components/FortunePanel.svelte', import.meta.url),
    'utf8'
  );

  assert.match(source, /import \{ fortuneImagePath \} from '\.\.\/data\/fortune-images';/);
  assert.match(source, /<img\s+class="fortune-image"/);
  assert.match(source, /src=\{fortuneImagePath\(currentFortune\.name\)\}/);
  assert.ok(
    source.indexOf('<img\n          class="fortune-image"') <
      source.indexOf('class="fortune-name-wrap"'),
    'fortune image should be rendered above the fortune text'
  );
  assert.match(source, /class:image-loaded=\{imageLoaded\}/);
  assert.match(source, /on:load=\{\(\) => \(imageLoaded = true\)\}/);
  assert.match(source, /on:error=\{\(\) => \(imageErrored = true\)\}/);
});

test('fortune panel renders linked artist credit beside the image', async () => {
  const source = await readFile(
    new URL('../src/components/FortunePanel.svelte', import.meta.url),
    'utf8'
  );

  assert.match(source, /currentFortune\.artist/);
  assert.match(source, /currentFortune\.artist_link/);
  assert.match(source, /href=\{currentFortune\.artist_link\}/);
  assert.match(source, />@\{currentFortune\.artist\}</);
  assert.match(source, /\.fortune-artist-credit\s*\{[^}]*position:\s*absolute;/s);
  assert.match(source, /\.fortune-artist-credit\s*\{[^}]*bottom:\s*0;/s);
  assert.match(source, /\.fortune-artist-credit\s*\{[^}]*left:\s*calc\(100% \+ 0\.5rem\);/s);
});

test('fortune debug trigger is development-only and previews the rare fortune', async () => {
  const source = await readFile(
    new URL('../src/components/FortunePanel.svelte', import.meta.url),
    'utf8'
  );

  assert.match(source, /const showFortuneDebug = import\.meta\.env\.DEV;/);
  assert.match(
    source,
    /function showRareFortuneDebug\(\)[\s\S]*fortune\.name === '超超超大吉'[\s\S]*state = 'Revealed';/
  );
  assert.match(
    source,
    /{#if showFortuneDebug}[\s\S]*class="fortune-debug-button"[\s\S]*on:click=\{showRareFortuneDebug\}/
  );
});

test('fortune image reveal keeps the initial layout compact and separates image from text', async () => {
  const source = await readFile(
    new URL('../src/components/FortunePanel.svelte', import.meta.url),
    'utf8'
  );

  assert.match(source, /class:reveal-layout=\{state === 'Revealed'\}/);
  assert.match(source, /class:stage-expanded=\{state === 'Revealed'\}/);
  assert.match(source, /\.fortune-stage\s*\{[^}]*min-height:\s*13rem;/s);
  assert.match(source, /\.stage-expanded\s*\{[^}]*min-height:\s*clamp\(/s);
  assert.match(source, /--fortune-reveal-space:\s*clamp\(/);
  assert.doesNotMatch(source, /--fortune-title-shift/);
  assert.match(source, /--fortune-text-shift:\s*calc\(var\(--fortune-reveal-space\) \* 15\);/);
  assert.match(source, /--fortune-image-gap:\s*calc\(var\(--fortune-reveal-space\) \* 15\);/);
  assert.match(source, /--fortune-image-height:\s*calc\(var\(--fortune-reveal-space\) \* 18\);/);
  assert.doesNotMatch(source, /\.reveal-layout\s+\.fortune-title/);
  assert.match(
    source,
    /\.reveal-layout\s+\.fortune-reveal-stack\s*\{[^}]*var\(--fortune-text-shift\)/s
  );
  assert.doesNotMatch(source, /fortuneLifted|fortune-lifted/);
  assert.match(source, /\.fortune-image-frame\s*\{[^}]*position:\s*absolute;/s);
  assert.match(
    source,
    /\.fortune-image-frame\s*\{[^}]*bottom:\s*calc\(100% \+ var\(--fortune-image-gap\)\);/s
  );
  assert.match(source, /\.fortune-image-frame\s*\{[^}]*height:\s*var\(--fortune-image-height\);/s);
  assert.match(source, /\.fortune-image\s*\{[^}]*transition-delay:\s*180ms;/s);
  assert.doesNotMatch(source, /\.image-loaded\s*\{[^}]*transition-delay:/s);
});
