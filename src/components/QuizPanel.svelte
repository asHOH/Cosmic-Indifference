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

  const HOLD_CONFIRM_MS = 500;
  const RESULT_ADVANCE_DELAY_MS = 1500;
  const SCORE_PER_QUESTION = 10;
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
  $: progressText = `${Math.min(currentIndex + 1, questions.length)} / ${questions.length}`;
  $: resultBadge = badgeForScore(score);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    await delay(240);

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
    if (value >= 100) return { text: '💎🏆', className: 'diamond' };
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
        <span>{progressText}</span>
        <span>{score}</span>
      </div>

      <h1 class="question-prompt">{currentQuestion.prompt}</h1>

      <div class="answer-grid">
        {#each currentOptions as option, index (option.id)}
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
            <span class="answer-letter">{String.fromCharCode(65 + index)}</span>
            <span class="answer-text">{option.text}</span>
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

  .quiz-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.2rem;
    color: rgb(255 255 255 / 0.58);
    font-size: clamp(0.88rem, 2.2vw, 1rem);
    font-weight: 500;
    letter-spacing: 0.16em;
  }

  .question-prompt {
    min-height: 4.8rem;
    margin-bottom: 1.4rem;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.72rem;
  }

  .answer-option {
    position: relative;
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    min-height: 4.45rem;
    overflow: hidden;
    border: 1px solid rgb(var(--quiz-accent-rgb) / 0.38);
    border-radius: 8px;
    background:
      linear-gradient(130deg, rgb(255 255 255 / 0.09), rgb(255 255 255 / 0.02)), rgb(3 9 18 / 0.74);
    color: white;
    cursor: pointer;
    align-items: center;
    gap: 0.7rem;
    padding: 0.9rem 1rem;
    text-align: left;
    touch-action: manipulation;
    transition:
      border-color 180ms ease,
      box-shadow 180ms ease,
      transform 180ms ease,
      opacity 180ms ease;
  }

  .answer-option:disabled {
    cursor: default;
  }

  .answer-option:not(:disabled):hover,
  .answer-option.pressing {
    border-color: rgb(var(--quiz-accent-rgb) / 0.86);
    box-shadow: 0 0 26px rgb(var(--quiz-accent-rgb) / 0.24);
  }

  .answer-option.selected {
    transform: translateY(-1px);
  }

  .answer-option.correct {
    border-color: rgb(80 255 180 / 0.82);
    box-shadow: 0 0 30px rgb(80 255 180 / 0.24);
  }

  .answer-option.wrong {
    border-color: rgb(255 83 102 / 0.82);
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

  .answer-letter,
  .answer-text {
    position: relative;
    z-index: 1;
  }

  .answer-letter {
    display: inline-flex;
    width: 2rem;
    height: 2rem;
    align-items: center;
    justify-content: center;
    border: 1px solid rgb(var(--quiz-accent-rgb) / 0.48);
    border-radius: 999px;
    color: var(--quiz-accent);
    font-size: 0.85rem;
    font-weight: 700;
  }

  .answer-text {
    min-width: 0;
    font-size: clamp(1rem, 2.7vw, 1.18rem);
    font-weight: 500;
    line-height: 1.38;
    overflow-wrap: anywhere;
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

  .score-badge.diamond {
    animation: diamond-pulse 680ms linear infinite alternate;
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
    animation: perfect-quake 180ms linear infinite;
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

  @keyframes diamond-pulse {
    from {
      transform: scale(1) rotate(-2deg);
      filter: drop-shadow(0 0 20px rgb(var(--quiz-accent-rgb) / 0.86));
    }
    to {
      transform: scale(1.12) rotate(2deg);
      filter: drop-shadow(0 0 24px rgb(var(--quiz-accent-rgb) / 0.95))
        drop-shadow(0 0 54px rgb(255 255 255 / 0.55));
    }
  }

  @media (max-width: 640px) {
    .quiz-shell {
      width: min(92vw, 34rem);
      gap: 1.3rem;
    }

    .answer-grid {
      grid-template-columns: 1fr;
      gap: 0.55rem;
    }

    .answer-option {
      min-height: 3.85rem;
      padding: 0.72rem 0.82rem;
    }

    .question-prompt {
      min-height: 4.1rem;
      margin-bottom: 1rem;
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
