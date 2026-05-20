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

test('prompt lyric text is larger without changing separators or surrounding prompt text', () => {
  assert.match(
    source,
    /class="question-prompt"[\s\S]*promptTextParts\(currentQuestion\.prompt\)[\s\S]*class="prompt-lyric-text"/,
    'prompt should render lyric text with a prompt-only lyric class'
  );
  assert.doesNotMatch(
    source,
    /class="answer-text"[\s\S]*class="prompt-lyric-text"/,
    'option text should not use prompt lyric sizing'
  );
  assert.match(
    source,
    /\.prompt-lyric-text\s*{[\s\S]*font-size:\s*1\.\d+em;/,
    'prompt lyric text should be slightly larger than surrounding prompt text'
  );
});

test('question progress emphasizes only the current question index', () => {
  assert.match(
    source,
    /\$: progressText = `\$\{progressCurrent\}  \/\$\{progressTotal\}`;/,
    'progress text should include two spaces before slash and no space after it'
  );
  assert.match(
    source,
    /class="quiz-progress"[\s\S]*class="quiz-progress-current"[\s\S]*class="quiz-progress-rest"/,
    'progress should render current index separately from slash and total'
  );
  assert.match(
    source,
    /class="quiz-progress-rest"[\s\S]*>\s*\{'  '\}\/\{progressTotal\}/,
    'visible progress rest should include two preserved spaces before slash'
  );
  assert.match(
    source,
    /\.quiz-progress-rest\s*{[\s\S]*white-space:\s*pre;/,
    'visible progress rest should preserve the additional space'
  );
  assert.match(
    source,
    /\.quiz-progress-current\s*{[\s\S]*color:\s*var\(--quiz-accent\);[\s\S]*font-size:\s*clamp\(1\.28rem,\s*4vw,\s*2\.35rem\);/,
    'current question index should use the quiz accent and prompt text size'
  );
  assert.match(
    source,
    /\.quiz-progress-rest\s*{[\s\S]*letter-spacing:\s*0;/,
    'slash and total should avoid loose digit spacing'
  );
});
