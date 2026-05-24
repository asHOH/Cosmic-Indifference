<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import AnswerSparkle from './AnswerSparkle.svelte';
  import ParticleBurst from './ParticleBurst.svelte';
  import RollButton from './RollButton.svelte';
  import { createQuiz, type QuizOption, type QuizQuestion } from '../data/quiz';
  import { bucketForQuizScore, quizResultComments } from '../data/quiz-result-comments';

  export let onStart: () => void = () => {};
  export let onComplete: () => void | Promise<void> = () => {};

  type QuizState = 'Idle' | 'Question' | 'Result';
  type CelebrationParticle = {
    id: number;
    x: number;
    y: number;
    spin: number;
    delay: number;
    size: number;
    glyph: string;
  };
  type LyricTextPart = {
    text: string;
    isSeparator: boolean;
    isPromptLyric?: boolean;
  };

  const HOLD_CONFIRM_MS = 500;
  const ANSWER_ADVANCE_DELAY_MS = 700;
  const RESULT_ADVANCE_DELAY_MS = 1500;
  const SCORE_PER_QUESTION = 10;
  const modestGlyphs = ['✦', '✧', '•'];
  const showPerfectDebug = import.meta.env.DEV;

  let state: QuizState = 'Idle';
  let questions: QuizQuestion[] = [];
  let currentIndex = 0;
  let score = 0;
  let pressingOptionId = '';
  let selectedOptionId = '';
  let answeringLocked = false;
  let resultComment = '';
  let showAdvance = false;
  let celebration: 'none' | 'modest' | 'perfect' = 'none';
  let particles: CelebrationParticle[] = [];
  let currentQuestion: QuizQuestion | undefined;
  let currentOptions: QuizOption[] = [];
  let visibleParticles: CelebrationParticle[] = [];
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let resultTimer: ReturnType<typeof setTimeout> | undefined;

  $: currentQuestion = questions[currentIndex];
  $: currentOptions = currentQuestion?.options ?? [];
  $: visibleParticles = particles;
  $: progressCurrent = Math.min(currentIndex + 1, questions.length);
  $: progressTotal = questions.length;
  $: progressText = `${progressCurrent}  /${progressTotal}`;
  $: resultBadge = badgeForScore(score);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  function lyricTextParts(text: string, isPromptLyric = false): LyricTextPart[] {
    return text
      .split(/(\/)/)
      .filter(Boolean)
      .map((part) => ({
        text: part,
        isSeparator: part === '/',
        isPromptLyric: part !== '/' && isPromptLyric,
      }));
  }

  function promptTextParts(text: string): LyricTextPart[] {
    const parts: LyricTextPart[] = [];
    const quotedText = /“([^”]+)”/g;
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = quotedText.exec(text)) !== null) {
      const quotedContent = match[1];
      const quoteEnd = match.index + match[0].length;
      const isLyricQuote = !text.slice(quoteEnd).startsWith('这首歌');

      if (match.index > cursor) {
        parts.push(...lyricTextParts(text.slice(cursor, match.index)));
      }

      parts.push(...lyricTextParts(quotedContent, isLyricQuote));
      cursor = quoteEnd;
    }

    if (cursor < text.length) {
      parts.push(...lyricTextParts(text.slice(cursor)));
    }

    return parts.length > 0 ? parts : lyricTextParts(text);
  }

  function startQuiz() {
    questions = createQuiz();
    currentIndex = 0;
    score = 0;
    selectedOptionId = '';
    pressingOptionId = '';
    answeringLocked = false;
    resultComment = '';
    showAdvance = false;
    celebration = 'none';
    particles = [];
    state = 'Question';
    onStart();
  }

  function clearHold() {
    clearTimeout(holdTimer);
    holdTimer = undefined;
    pressingOptionId = '';
  }

  function beginHold(option: QuizOption) {
    if (answeringLocked || selectedOptionId) return;

    clearHold();
    pressingOptionId = option.id;
    holdTimer = setTimeout(() => {
      confirmOption(option);
    }, HOLD_CONFIRM_MS);
  }

  async function confirmOption(option: QuizOption) {
    if (answeringLocked || selectedOptionId) return;

    clearHold();
    answeringLocked = true;
    selectedOptionId = option.id;

    if (option.correct) {
      score += SCORE_PER_QUESTION;
    }

    await delay(ANSWER_ADVANCE_DELAY_MS);

    if (currentIndex >= questions.length - 1) {
      showResult();
      return;
    }

    currentIndex += 1;
    selectedOptionId = '';
    answeringLocked = false;
  }

  function selectComment(finalScore: number) {
    const bucket = bucketForQuizScore(finalScore);
    const comments = quizResultComments[bucket];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  function makeParticles() {
    return Array.from({ length: 30 }, (_, id) => ({
      id,
      x: Math.random() * 220 - 110,
      y: Math.random() * 180 - 120,
      spin: Math.random() * 720 - 360,
      delay: Math.random() * 360,
      size: 0.75 + Math.random() * 0.75,
      glyph: modestGlyphs[Math.floor(Math.random() * modestGlyphs.length)],
    }));
  }

  function showResult() {
    state = 'Result';
    selectedOptionId = '';
    answeringLocked = false;
    resultComment = selectComment(score);
    showAdvance = false;
    celebration = score === 100 ? 'perfect' : score >= 60 ? 'modest' : 'none';
    particles = celebration === 'modest' ? makeParticles() : [];

    clearTimeout(resultTimer);
    resultTimer = setTimeout(() => {
      showAdvance = true;
    }, RESULT_ADVANCE_DELAY_MS);
  }

  function showPerfectDebugResult() {
    clearHold();
    clearTimeout(resultTimer);
    state = 'Result';
    questions = [];
    currentIndex = 0;
    score = 100;
    selectedOptionId = '';
    pressingOptionId = '';
    answeringLocked = false;
    resultComment = selectComment(100);
    showAdvance = true;
    celebration = 'perfect';
    particles = [];
    onStart();
  }

  function badgeForScore(value: number) {
    if (value >= 100) return { text: '🏆', className: 'perfect' };
    if (value >= 90) return { text: '🏆', className: 'gold' };
    if (value >= 80) return { text: '🏆', className: 'silver' };
    if (value >= 70) return { text: '🏆', className: 'bronze' };
    if (value >= 60) return { text: '👍', className: 'thumb' };
    return { text: '💬', className: 'comment' };
  }

  async function advanceAfterQuiz() {
    if (!showAdvance) return;
    await onComplete();
  }

  onDestroy(() => {
    clearTimeout(holdTimer);
    clearTimeout(resultTimer);
  });
</script>

<div
  class="quiz-shell relative z-20 flex flex-col items-center justify-center text-center"
  style="--hold-confirm-ms: {HOLD_CONFIRM_MS}ms"
>
  {#if state === 'Idle'}
    <h1 class="quiz-title text-5xl font-bold tracking-widest">测验：宇宙冷漠</h1>

    <div class="quiz-stage flex min-h-52 flex-col items-center justify-center"></div>

    <RollButton
      style="--roll-button-color: var(--quiz-accent); --roll-button-glow: rgb(var(--quiz-accent-rgb) / 0.55)"
      on:click={startQuiz}
    >
      我有所了解
    </RollButton>

    {#if showPerfectDebug}
      <button
        type="button"
        class="perfect-debug-button"
        aria-label="Debug perfect score animation"
        on:click={showPerfectDebugResult}
      >
        Debug Perfect
      </button>
    {/if}
  {:else if state === 'Question' && currentQuestion}
    <section class="question-panel" aria-live="polite">
      <div class="quiz-meta">
        <span class="quiz-progress" aria-label={progressText}>
          <span class="quiz-progress-current">{progressCurrent}</span><span
            class="quiz-progress-rest"
          >
            {'  '}/{progressTotal}</span
          >
        </span>
      </div>

      <h1 class="question-prompt">
        {#each promptTextParts(currentQuestion.prompt) as part}
          {#if part.isSeparator}
            <span class="lyric-separator">{part.text}</span>
          {:else if part.isPromptLyric}
            <span class="prompt-lyric-text">{part.text}</span>
          {:else}
            {part.text}
          {/if}
        {/each}
      </h1>

      <div class="answer-grid">
        {#each currentOptions as option (option.id)}
          <button
            type="button"
            class="answer-option"
            class:pressing={pressingOptionId === option.id}
            class:selected={selectedOptionId === option.id}
            class:correct={selectedOptionId === option.id && option.correct}
            class:wrong={selectedOptionId === option.id && !option.correct}
            disabled={answeringLocked}
            on:pointerdown={() => beginHold(option)}
            on:pointerup={clearHold}
            on:pointerleave={clearHold}
            on:pointercancel={clearHold}
          >
            <span class="answer-fill"></span>
            <span class="answer-text">
              {#each lyricTextParts(option.text) as part}
                {#if part.isSeparator}
                  <span class="lyric-separator">{part.text}</span>
                {:else}
                  {part.text}
                {/if}
              {/each}
            </span>
            {#if selectedOptionId === option.id && option.correct}
              <AnswerSparkle />
            {/if}
          </button>
        {/each}
      </div>
    </section>
  {:else}
    <section
      class="result-panel"
      class:celebrate-modest={celebration === 'modest'}
      class:celebrate-perfect={celebration === 'perfect'}
      aria-live="polite"
    >
      <ParticleBurst particles={visibleParticles} perfect={celebration === 'perfect'} />

      <div class="score-badge {resultBadge.className}">{resultBadge.text}</div>
      <p class="score-line">{score}</p>
      <p class="result-comment">{resultComment}</p>

      {#if showAdvance}
        <button
          type="button"
          class="advance-button"
          aria-label="继续"
          title="继续"
          on:click={advanceAfterQuiz}
          transition:fade={{ duration: 260 }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      {/if}
    </section>
  {/if}
</div>

<style>
  .quiz-shell {
    --quiz-accent: #ffd166;
    --quiz-accent-rgb: 255 209 102;
    --quiz-accent-bright: #ffe8a3;
    --quiz-meta-height: 2.6rem;
    --question-prompt-height: 6.7rem;
    --answer-option-height: 4.9rem;
    --answer-row-gap: 0.64rem;
    --question-row-gap: 1.2rem;

    width: min(92vw, 760px);
    gap: 2rem;
  }

  .quiz-title {
    color: var(--quiz-accent);
    line-height: 1.12;
    text-shadow: 0 0 20px rgb(var(--quiz-accent-rgb) / 0.42);
  }

  .quiz-stage {
    width: min(88vw, 720px);
  }

  .perfect-debug-button {
    position: absolute;
    right: 0;
    bottom: -4.4rem;
    border: 1px solid rgb(var(--quiz-accent-rgb) / 0.42);
    border-radius: 999px;
    background: rgb(0 0 0 / 0.36);
    color: rgb(255 255 255 / 0.72);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 0.45rem 0.7rem;
    text-transform: uppercase;
    transition:
      border-color 160ms ease,
      color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease;
  }

  .perfect-debug-button:hover {
    border-color: rgb(var(--quiz-accent-rgb) / 0.78);
    color: white;
    box-shadow: 0 0 18px rgb(var(--quiz-accent-rgb) / 0.28);
    transform: translateY(-1px);
  }

  .question-panel,
  .result-panel {
    position: relative;
    width: 100%;
  }

  .question-panel {
    display: grid;
    grid-template-rows:
      var(--quiz-meta-height) var(--question-prompt-height)
      calc(var(--answer-option-height) * 4 + var(--answer-row-gap) * 3);
    row-gap: var(--question-row-gap);
  }

  .quiz-meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    height: var(--quiz-meta-height);
    margin-bottom: 0;
    color: rgb(255 255 255 / 0.58);
    font-size: clamp(0.88rem, 2.2vw, 1rem);
    font-weight: 500;
    letter-spacing: 0.16em;
  }

  .quiz-progress {
    display: inline-flex;
    align-items: baseline;
    letter-spacing: 0;
  }

  .quiz-progress-current {
    color: var(--quiz-accent);
    font-size: clamp(1.28rem, 4vw, 2.35rem);
    font-weight: 700;
    line-height: 1;
    text-shadow: 0 0 18px rgb(var(--quiz-accent-rgb) / 0.28);
  }

  .quiz-progress-rest {
    letter-spacing: 0;
    white-space: pre;
  }

  .question-prompt {
    display: flex;
    height: var(--question-prompt-height);
    align-items: center;
    justify-content: center;
    margin-bottom: 0;
    overflow: hidden;
    color: #f8fbff;
    font-size: clamp(1.28rem, 4vw, 2.35rem);
    font-weight: 700;
    line-height: 1.35;
    text-wrap: balance;
    text-shadow:
      0 0 18px rgb(var(--quiz-accent-rgb) / 0.3),
      0 8px 40px rgb(0 0 0 / 0.7);
  }

  .answer-grid {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, var(--answer-option-height));
    gap: var(--answer-row-gap);
  }

  .answer-option {
    position: relative;
    display: flex;
    height: var(--answer-option-height);
    min-height: 0;
    align-items: center;
    overflow: hidden;
    border: 0;
    border-radius: 8px;
    background:
      linear-gradient(130deg, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.025)), rgb(3 9 18 / 0.62);
    color: white;
    cursor: pointer;
    padding: 0.72rem 1.05rem;
    text-align: left;
    touch-action: manipulation;
    transition:
      background-color 180ms ease,
      box-shadow 180ms ease,
      transform 180ms ease,
      opacity 180ms ease;
  }

  .answer-option:disabled {
    cursor: default;
  }

  .answer-option:not(:disabled):hover,
  .answer-option.pressing {
    background:
      linear-gradient(130deg, rgb(var(--quiz-accent-rgb) / 0.12), rgb(255 255 255 / 0.03)),
      rgb(3 9 18 / 0.7);
    box-shadow: 0 0 26px rgb(var(--quiz-accent-rgb) / 0.24);
  }

  .answer-option.selected {
    transform: translateY(-1px);
  }

  .answer-option.correct {
    animation: correct-answer-sparkle 600ms ease-out both;
    background:
      linear-gradient(130deg, rgb(42 255 126 / 0.2), rgb(85 255 180 / 0.06)), rgb(2 14 12 / 0.76);
    box-shadow: 0 0 32px rgb(42 255 126 / 0.34);
  }

  .answer-option.correct::after {
    position: absolute;
    inset: -35%;
    z-index: 2;
    pointer-events: none;
    content: '';
    background:
      radial-gradient(circle at 28% 38%, rgb(255 255 255 / 0.6) 0 1px, transparent 2px),
      radial-gradient(circle at 46% 58%, rgb(80 255 180 / 0.55) 0 1px, transparent 2px),
      radial-gradient(circle at 72% 32%, rgb(var(--quiz-accent-rgb) / 0.5) 0 1px, transparent 2px);
    opacity: 0;
    animation: answer-sparkle-wash 600ms ease-out both;
  }

  .answer-option.wrong {
    background:
      linear-gradient(130deg, rgb(255 83 102 / 0.14), rgb(255 255 255 / 0.03)), rgb(3 9 18 / 0.7);
    box-shadow: 0 0 30px rgb(255 83 102 / 0.22);
  }

  .answer-fill {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(90deg, rgb(var(--quiz-accent-rgb) / 0.34), rgb(255 255 255 / 0.1));
    opacity: 0.9;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--hold-confirm-ms) cubic-bezier(0.16, 1, 0.3, 1);
  }

  .answer-option.pressing .answer-fill {
    transform: scaleX(1);
  }

  .answer-option.selected .answer-fill {
    transform: scaleX(1);
  }

  .answer-option.correct .answer-fill {
    background: linear-gradient(90deg, rgb(31 255 105 / 0.5), rgb(117 255 178 / 0.2));
  }

  .answer-text {
    position: relative;
    z-index: 1;
  }

  .answer-text {
    min-width: 0;
    font-size: clamp(0.96rem, 2.4vw, 1.06rem);
    font-weight: 500;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .lyric-separator {
    display: inline-block;
    font-size: 0.72em;
    font-weight: 400;
    margin-inline: 0.4em;
    opacity: 0.42;
    text-shadow: none;
    transform: translateY(-0.04em);
  }

  .prompt-lyric-text {
    font-size: 1.15em;
  }

  .result-panel {
    display: flex;
    min-height: 22rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .score-badge {
    position: relative;
    z-index: 1;
    font-size: clamp(4.5rem, 17vw, 8.25rem);
    line-height: 1;
    filter: drop-shadow(0 0 22px rgb(var(--quiz-accent-rgb) / 0.35));
  }

  .score-badge.bronze {
    filter: sepia(1) saturate(1.5) hue-rotate(335deg) drop-shadow(0 0 24px rgb(185 105 47 / 0.7));
  }

  .score-badge.silver {
    filter: grayscale(0.86) brightness(1.55) drop-shadow(0 0 24px rgb(210 228 240 / 0.72));
  }

  .score-badge.gold {
    filter: saturate(1.4) drop-shadow(0 0 30px rgb(255 205 75 / 0.8));
  }

  .score-badge.perfect {
    font-size: clamp(9rem, 34vw, 20rem);
    filter: saturate(1.5) drop-shadow(0 0 34px rgb(255 205 75 / 0.95))
      drop-shadow(0 0 74px rgb(255 255 255 / 0.55));
  }

  .score-line {
    margin-top: 0.7rem;
    color: var(--quiz-accent);
    font-size: clamp(2.3rem, 9vw, 4.2rem);
    font-weight: 800;
    line-height: 1;
    text-shadow: 0 0 26px rgb(var(--quiz-accent-rgb) / 0.44);
  }

  .celebrate-perfect .score-line {
    font-size: clamp(3.3rem, 12vw, 6.4rem);
  }

  .result-comment {
    width: min(84vw, 36rem);
    min-height: 3rem;
    margin-top: 1rem;
    color: rgb(255 255 255 / 0.72);
    font-size: clamp(1.05rem, 3.2vw, 1.5rem);
    font-weight: 300;
    line-height: 1.45;
    letter-spacing: 0.05em;
    text-shadow: 0 0 16px rgb(var(--quiz-accent-rgb) / 0.24);
  }

  .advance-button {
    position: absolute;
    right: 0;
    bottom: 0;
    display: inline-flex;
    width: 3.2rem;
    height: 3.2rem;
    align-items: center;
    justify-content: center;
    border: 1px solid rgb(var(--quiz-accent-rgb) / 0.62);
    border-radius: 999px;
    color: var(--quiz-accent);
    background: rgb(0 0 0 / 0.22);
    transition:
      color 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease,
      transform 180ms ease;
  }

  .advance-button:hover {
    color: white;
    border-color: rgb(255 255 255 / 0.78);
    box-shadow: 0 0 24px rgb(var(--quiz-accent-rgb) / 0.38);
    transform: translateX(2px);
  }

  .advance-button svg {
    width: 1.45rem;
    height: 1.45rem;
  }

  .celebrate-perfect {
    animation: perfect-quake 120ms linear 18;
    transform-origin: center;
  }

  @keyframes correct-answer-sparkle {
    0%,
    100% {
      filter: brightness(1);
    }

    45% {
      filter: brightness(1.18);
    }
  }

  @keyframes answer-sparkle-wash {
    0% {
      opacity: 0;
      transform: translateX(-16%) rotate(-4deg);
    }

    24% {
      opacity: 0.78;
    }

    100% {
      opacity: 0;
      transform: translateX(16%) rotate(4deg);
    }
  }

  @keyframes perfect-quake {
    0%,
    100% {
      transform: translate(0, 0) rotate(0deg) scale(1);
    }
    12.5% {
      transform: translate(9px, -7px) rotate(-2.4deg) scale(1.015);
    }
    25% {
      transform: translate(-7px, 5px) rotate(1.7deg) scale(0.995);
    }
    37.5% {
      transform: translate(8px, 6px) rotate(-1.8deg) scale(1.012);
    }
    50% {
      transform: translate(-8px, 7px) rotate(2.2deg) scale(0.992);
    }
    62.5% {
      transform: translate(7px, -6px) rotate(-2deg) scale(1.01);
    }
    75% {
      transform: translate(-6px, -5px) rotate(1.8deg) scale(0.996);
    }
    87.5% {
      transform: translate(5px, 4px) rotate(-1.2deg) scale(1.006);
    }
  }

  @media (max-width: 640px) {
    .quiz-shell {
      --quiz-meta-height: 2.3rem;
      --question-prompt-height: 5.6rem;
      --answer-option-height: 4.55rem;
      --answer-row-gap: 0.56rem;
      --question-row-gap: 0.9rem;

      width: min(92vw, 34rem);
      gap: 1.3rem;
    }

    .answer-option {
      padding: 0.62rem 0.82rem;
    }

    .advance-button {
      right: 50%;
      bottom: -3.7rem;
      transform: translateX(50%);
    }

    .advance-button:hover {
      transform: translateX(50%) translateY(-1px);
    }
  }
</style>
