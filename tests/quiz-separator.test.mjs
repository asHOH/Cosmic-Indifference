import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../src/components/QuizPanel.svelte', import.meta.url),
  'utf8'
);
const answerSparkleSource = await readFile(
  new URL('../src/components/AnswerSparkle.svelte', import.meta.url),
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
  assert.match(
    source,
    /\.lyric-separator\s*{[\s\S]*margin-inline:\s*0\.4em;/,
    'separator should render visual spacing around itself'
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

test('prompt separators outside quoted lyrics use the subdued slash style', () => {
  assert.match(
    source,
    /parts\.push\(\.\.\.lyricTextParts\(text\.slice\(cursor,\s*match\.index\)\)\);/,
    'prompt text before a quoted lyric should still split slash separators'
  );
  assert.match(
    source,
    /parts\.push\(\.\.\.lyricTextParts\(text\.slice\(cursor\)\)\);/,
    'prompt text after quoted lyrics should still split slash separators'
  );
});

test('question layout reserves fixed prompt and answer rows across questions', () => {
  assert.match(
    source,
    /\.question-panel\s*{[\s\S]*grid-template-rows:\s*var\(--quiz-meta-height\)\s+var\(--question-prompt-height\)\s+calc\(/,
    'question panel should use fixed rows so centering does not shift between question heights'
  );
  assert.match(
    source,
    /\.question-prompt\s*{[\s\S]*height:\s*var\(--question-prompt-height\);/,
    'prompt should reserve a fixed two-line slot'
  );
  assert.match(
    source,
    /\.answer-grid\s*{[\s\S]*grid-template-rows:\s*repeat\(4,\s*var\(--answer-option-height\)\);/,
    'answer grid should reserve fixed rows for all four options'
  );
  assert.match(
    source,
    /\.answer-option\s*{[\s\S]*height:\s*var\(--answer-option-height\);/,
    'answer buttons should use the fixed row height instead of growing the panel'
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

test('confirmed correct options keep fill and sparkle lightly', () => {
  assert.match(
    source,
    /\.answer-option\.selected \.answer-fill\s*{[\s\S]*transform:\s*scaleX\(1\);/,
    'selected answer should keep the hold progress fill expanded'
  );
  assert.match(
    answerSparkleSource,
    /class="answer-correct-particles"[\s\S]*class="answer-correct-particle"/,
    'correct selected answer should render lightweight particle spans'
  );
  assert.match(
    source,
    /\.answer-option\.correct::after\s*{[\s\S]*animation:\s*answer-sparkle-wash/,
    'correct answer should have a light sparkle wash'
  );
});

test('perfect score uses an oversized gold trophy and finite shake', () => {
  assert.match(
    source,
    /if \(value >= 100\) return { text: '🏆', className: 'perfect' };/,
    'perfect score should show only a trophy badge'
  );
  assert.doesNotMatch(source, /💎🏆/, 'perfect score should not include the diamond emoji');
  assert.match(
    source,
    /\.score-badge\.perfect\s*{[\s\S]*font-size:\s*clamp\(7rem,\s*28vw,\s*15rem\);[\s\S]*filter:\s*saturate\(1\.5\)/,
    'perfect score trophy should be exceptionally large and gold'
  );
  assert.match(
    source,
    /\.celebrate-perfect\s*{[\s\S]*animation:\s*perfect-quake 180ms linear 12;/,
    'perfect score shaking should stop after about 2 seconds'
  );
});
