import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../src/components/QuizPanel.svelte', import.meta.url),
  'utf8'
);

test('quiz lyric separators are rendered as subdued spans in prompts and options', () => {
  assert.match(
    source,
    /class="question-prompt"[\s\S]*class="lyric-separator"/,
    'prompt text should render slash separators with lyric-separator class'
  );
  assert.match(
    source,
    /class="answer-text"[\s\S]*class="lyric-separator"/,
    'option text should render slash separators with lyric-separator class'
  );
  assert.match(
    source,
    /\.lyric-separator\s*{[\s\S]*font-size:\s*0\.72em;[\s\S]*opacity:\s*0\.42;/,
    'separator styling should make slash smaller and more transparent'
  );
});
