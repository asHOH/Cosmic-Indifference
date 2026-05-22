import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

async function loadFortunesModule() {
  const source = await readFile(new URL('../src/data/fortunes.ts', import.meta.url), 'utf8');
  const require = createRequire(import.meta.url);
  const smolTomlUrl = pathToFileURL(require.resolve('smol-toml')).href;
  const testableSource = source
    .replace("import { parse } from 'smol-toml';", `import { parse } from '${smolTomlUrl}';`)
    .replace("import fortunesSource from './fortunes.toml?raw';", "const fortunesSource = '';")
    .replace(
      'export const fortunes = parseFortunesToml(fortunesSource);',
      'export const fortunes = [];'
    );
  const { outputText } = ts.transpileModule(testableSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

test('fortune parser accepts optional artist credit fields', async () => {
  const { parseFortunesToml } = await loadFortunesModule();

  const fortunes = parseFortunesToml(`
    [[fortunes]]
    name = "超超超大吉"
    color = "#ff4d4f"
    artist = "笨蛋芷荧"
    artist_link = "https://space.bilibili.com/1708779209"
  `);

  assert.equal(fortunes[0].artist, '笨蛋芷荧');
  assert.equal(fortunes[0].artist_link, 'https://space.bilibili.com/1708779209');
});
