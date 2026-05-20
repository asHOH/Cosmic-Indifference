<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
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
  const correctAnswerParticles = Array.from({ length: 7 }, (_, index) => index);
  const modestGlyphs = ['✦', '✧', '•'];
  const perfectGlyphs = ['✦', '✧', '◆', '◇', '✺', '✹', '✷', '✶', '◈'];

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

  function makeParticles(kind: 'modest' | 'perfect') {
    const glyphs = kind === 'perfect' ? perfectGlyphs : modestGlyphs;
    const count = kind === 'perfect' ? 120 : 30;
    return Array.from({ length: count }, (_, id) => ({
      id,
      x: Math.random() * 220 - 110,
      y: Math.random() * 180 - 120,
      spin: Math.random() * 720 - 360,
      delay: Math.random() * (kind === 'perfect' ? 900 : 360),
      size: kind === 'perfect' ? 0.75 + Math.random() * 1.65 : 0.75 + Math.random() * 0.75,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
    }));
  }

  function showResult() {
    state = 'Result';
    selectedOptionId = '';
    answeringLocked = false;
    resultComment = selectComment(score);
    showAdvance = false;
    celebration = score === 100 ? 'perfect' : score >= 60 ? 'modest' : 'none';
    particles = celebration === 'none' ? [] : makeParticles(celebration);

    clearTimeout(resultTimer);
    resultTimer = setTimeout(() => {
      showAdvance = true;
    }, RESULT_ADVANCE_DELAY_MS);
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
    <h1 class="quiz-title text-5xl font-bold tracking-widest">测试：宇宙冷漠</h1>

    <div class="quiz-stage flex min-h-52 flex-col items-center justify-center"></div>

    <RollButton
      style="--roll-button-color: var(--quiz-accent); --roll-button-glow: rgb(var(--quiz-accent-rgb) / 0.55)"
      on:click={startQuiz}
    >
      我有所了解
    </RollButton>
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
              <span class="answer-correct-particles" aria-hidden="true">
                {#each correctAnswerParticles as particle}
                  <span class="answer-correct-particle" style="--particle-index: {particle}"></span>
                {/each}
              </span>
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
      {#if visibleParticles.length > 0}
        <div class="celebration-field" aria-hidden="true">
          {#each visibleParticles as particle (particle.id)}
            <span
              class="particle"
              style="--x: {particle.x}px; --y: {particle.y}px; --spin: {particle.spin}deg; --delay: {particle.delay}ms; --size: {particle.size}"
            >
              {particle.glyph}
            </span>
          {/each}
        </div>
      {/if}

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

  .answer-correct-particles {
    position: absolute;
    inset: 0;
    z-index: 3;
    overflow: hidden;
    pointer-events: none;
  }

  .answer-correct-particle {
    position: absolute;
    width: 0.28rem;
    height: 0.28rem;
    border-radius: 999px;
    background: rgb(245 255 230 / 0.9);
    box-shadow:
      0 0 8px rgb(80 255 180 / 0.68),
      0 0 16px rgb(var(--quiz-accent-rgb) / 0.32);
    opacity: 0;
    animation: correct-answer-particle 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: calc(var(--particle-index) * 24ms);
  }

  .answer-correct-particle:nth-child(1) {
    top: 25%;
    left: 18%;
    --particle-x: -18px;
    --particle-y: -22px;
  }

  .answer-correct-particle:nth-child(2) {
    top: 68%;
    left: 24%;
    --particle-x: -10px;
    --particle-y: 18px;
  }

  .answer-correct-particle:nth-child(3) {
    top: 35%;
    left: 42%;
    --particle-x: 12px;
    --particle-y: -20px;
  }

  .answer-correct-particle:nth-child(4) {
    top: 62%;
    left: 58%;
    --particle-x: 20px;
    --particle-y: 14px;
  }

  .answer-correct-particle:nth-child(5) {
    top: 28%;
    left: 76%;
    --particle-x: 18px;
    --particle-y: -18px;
  }

  .answer-correct-particle:nth-child(6) {
    top: 72%;
    left: 82%;
    --particle-x: 24px;
    --particle-y: 16px;
  }

  .answer-correct-particle:nth-child(7) {
    top: 48%;
    left: 66%;
    --particle-x: 10px;
    --particle-y: -26px;
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
    font-size: clamp(7rem, 28vw, 15rem);
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

  .celebration-field {
    position: absolute;
    inset: -40vh -30vw;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    top: 50%;
    left: 50%;
    color: var(--quiz-accent-bright);
    font-size: calc(1rem * var(--size));
    opacity: 0;
    animation: particle-burst 1500ms cubic-bezier(0.16, 1, 0.3, 1) infinite;
    animation-delay: var(--delay);
    text-shadow: 0 0 14px currentColor;
  }

  .celebrate-perfect .particle {
    color: hsl(calc(var(--spin) + 220) 95% 72%);
    animation-duration: 900ms;
    text-shadow:
      0 0 12px currentColor,
      0 0 30px currentColor;
  }

  .celebrate-perfect {
    animation: perfect-quake 180ms linear 12;
  }

  @keyframes particle-burst {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.3) rotate(0deg);
    }
    12% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1.7)
        rotate(var(--spin));
    }
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

  @keyframes correct-answer-particle {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(0.35);
    }

    18% {
      opacity: 0.9;
    }

    100% {
      opacity: 0;
      transform: translate(var(--particle-x), var(--particle-y)) scale(1.45);
    }
  }

  @keyframes perfect-quake {
    0%,
    100% {
      transform: translate(0, 0) rotate(0deg);
    }
    25% {
      transform: translate(3px, -2px) rotate(-0.7deg);
    }
    50% {
      transform: translate(-2px, 2px) rotate(0.9deg);
    }
    75% {
      transform: translate(2px, 3px) rotate(-0.4deg);
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
