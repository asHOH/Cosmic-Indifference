import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function loadPlayOptionImages() {
  const source = await readFile(
    new URL('../src/data/play-option-images.ts', import.meta.url),
    'utf8'
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

test('play option data defines the five 今天玩什么 results with comments', async () => {
  const source = await readFile(new URL('../src/data/play-options.toml', import.meta.url), 'utf8');

  const expected = [
    ['战士', '今天适合正面开战。'],
    ['猎人', '今天适合耐心瞄准。'],
    ['储君', '今天适合稳坐王座。'],
    ['骨姐', '今天适合优雅收割。'],
    ['机宝', '今天适合启动机宝模式。'],
  ];

  for (const [name, comment] of expected) {
    assert.match(source, new RegExp(`name = "${name}"`));
    assert.match(source, new RegExp(`comment = "${comment}"`));
  }
});

test('play option image path is separate from fortune images', async () => {
  const { playOptionImagePath } = await loadPlayOptionImages();

  assert.equal(playOptionImagePath('战士'), '/play-options/%E6%88%98%E5%A3%AB.webp');
});
