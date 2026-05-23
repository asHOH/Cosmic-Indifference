import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function loadAppModes() {
  const source = await readFile(new URL('../src/data/app-modes.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

test('app modes cycle from fortune to play to quiz and back to fortune', async () => {
  const { appModes, nextAppMode } = await loadAppModes();

  assert.deepEqual(appModes, ['fortune', 'play', 'quiz']);
  assert.equal(nextAppMode('fortune'), 'play');
  assert.equal(nextAppMode('play'), 'quiz');
  assert.equal(nextAppMode('quiz'), 'fortune');
});

test('mode toggle labels describe the next destination', async () => {
  const { nextModeLabels } = await loadAppModes();

  assert.equal(nextModeLabels.fortune, '切换到今天玩什么');
  assert.equal(nextModeLabels.play, '切换到测试');
  assert.equal(nextModeLabels.quiz, '切换到今日运势');
});
