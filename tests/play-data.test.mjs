import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'smol-toml';
import ts from 'typescript';

async function loadImagePaths() {
  const source = await readFile(new URL('../src/data/image-paths.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

test('play option data includes the base 今天玩什么 results with valid roll fields', async () => {
  const source = await readFile(new URL('../src/data/play-options.toml', import.meta.url), 'utf8');
  const data = parse(source);

  assert.ok(Array.isArray(data.options));

  const names = data.options.map((option) => option.name);
  for (const name of ['战士', '猎人', '储君', '骨姐', '机宝']) {
    assert.ok(names.includes(name), `play options should include ${name}`);
  }

  for (const [index, option] of data.options.entries()) {
    assert.equal(typeof option.name, 'string', `play option ${index + 1} needs a string name`);
    assert.equal(typeof option.color, 'string', `play option ${index + 1} needs a string color`);
    assert.equal(
      typeof option.comment,
      'string',
      `play option ${index + 1} needs a string comment`
    );
    if ('weight' in option) {
      assert.equal(
        typeof option.weight,
        'number',
        `play option ${index + 1} weight must be number`
      );
      assert.ok(option.weight > 0, `play option ${index + 1} weight must be positive`);
    }
    if ('artist' in option) {
      assert.equal(
        typeof option.artist,
        'string',
        `play option ${index + 1} artist must be string`
      );
    }
    if ('artist_link' in option) {
      assert.equal(
        typeof option.artist_link,
        'string',
        `play option ${index + 1} artist_link must be string`
      );
    }
  }
});

test('play option image path is separate from fortune images', async () => {
  const { playOptionImagePath } = await loadImagePaths();

  assert.equal(playOptionImagePath('战士'), '/play-options/%E6%88%98%E5%A3%AB.webp');
});
