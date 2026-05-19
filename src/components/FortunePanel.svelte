<script lang="ts">
  import RollButton from './RollButton.svelte';
  import { fortunes, type Fortune } from '../data/fortunes';

  type FortuneState = 'Idle' | 'Rolling' | 'Revealed';

  type FortuneTiming = {
    ROLL_INTERVAL_MS: number;
    ROLL_SLOWDOWN_MULTIPLIER: number;
    ROLL_ITERATIONS: number;
    FINAL_FORTUNE_ANIMATION_MS: number;
    FORTUNE_LIFT_MS: number;
    COMMENT_TYPE_INTERVAL_MS: number;
    REVEAL_DURATION_MS: number;
  };

  export let timing: FortuneTiming;
  export let onStart: () => void = () => {};
  export let onComplete: () => void | Promise<void> = () => {};

  let state: FortuneState = 'Idle';
  let currentFortune: Fortune | null = null;
  let fortuneLifted = false;
  let typedComment = '';

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const totalWeight = fortunes.reduce((sum, fortune) => sum + (fortune.weight ?? 1), 0);

  function randomFortune() {
    let roll = Math.random() * totalWeight;
    return (
      fortunes.find((fortune) => (roll -= fortune.weight ?? 1) <= 0) ??
      fortunes[fortunes.length - 1]
    );
  }

  async function typeComment(comment: string) {
    typedComment = '';
    for (const character of Array.from(comment)) {
      typedComment += character;
      await delay(timing.COMMENT_TYPE_INTERVAL_MS);
    }
  }

  async function rollFortune() {
    state = 'Rolling';
    fortuneLifted = false;
    typedComment = '';
    onStart();

    let rollIntervalMs = timing.ROLL_INTERVAL_MS;
    for (let i = 0; i < timing.ROLL_ITERATIONS; i++) {
      currentFortune = randomFortune();
      await delay(rollIntervalMs);
      rollIntervalMs *= timing.ROLL_SLOWDOWN_MULTIPLIER;
    }

    state = 'Revealed';
    await delay(timing.FINAL_FORTUNE_ANIMATION_MS);

    fortuneLifted = true;
    await delay(timing.FORTUNE_LIFT_MS);

    if (currentFortune?.comment) {
      await typeComment(currentFortune.comment);
    }

    await delay(timing.REVEAL_DURATION_MS);
    await onComplete();
  }
</script>

<div
  class="absolute z-20 flex flex-col items-center justify-center space-y-8"
  style="--final-fortune-animation-ms: {timing.FINAL_FORTUNE_ANIMATION_MS}ms; --fortune-lift-ms: {timing.FORTUNE_LIFT_MS}ms"
>
  <h1 class="text-5xl font-bold tracking-widest text-[#95cdfe]">今日运势</h1>

  <div class="fortune-stage flex min-h-52 flex-col items-center justify-center text-center">
    {#if (state === 'Rolling' || state === 'Revealed') && currentFortune}
      <div class="fortune-name-wrap" class:fortune-lifted={fortuneLifted}>
        <span
          class="fortune-name tracking-widest"
          class:final-fortune={state === 'Revealed'}
          style="color: {currentFortune.color}"
          >{currentFortune.name}
        </span>
      </div>

      {#if state === 'Revealed'}
        <p class="fortune-comment" aria-live="polite">
          {#each Array.from(typedComment) as character, index (index)}
            <span class="type-character">{character}</span>
          {/each}
        </p>
      {/if}
    {/if}
  </div>

  <RollButton
    on:click={rollFortune}
    class={state !== 'Idle' ? 'pointer-events-none opacity-0' : 'opacity-100'}
    disabled={state !== 'Idle'}
  >
    占卜
  </RollButton>
</div>

<style>
  .fortune-stage {
    position: relative;
    width: min(88vw, 720px);
  }

  .fortune-name-wrap {
    transform: translateY(0);
    transition: transform var(--fortune-lift-ms) cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }

  .fortune-lifted {
    transform: translateY(-1.35rem);
  }

  .fortune-name {
    display: inline-block;
    font-size: clamp(3rem, 9vw, 3.75rem);
    line-height: 1;
  }

  .final-fortune {
    animation: final-fortune var(--final-fortune-animation-ms) ease-out both;
    text-shadow: 0 0 18px currentColor;
  }

  .fortune-comment {
    white-space: pre-wrap;
    position: absolute;
    top: calc(50% + 1.8rem);
    left: 50%;
    width: min(78vw, 36rem);
    min-height: 2.25rem;
    margin-top: 0.75rem;
    color: rgb(255 255 255 / 0.6);
    font-size: clamp(1.125rem, 3.2vw, 1.5rem);
    font-weight: 300;
    line-height: 1.5;
    letter-spacing: 0.08em;
    text-shadow: 0 0 14px rgb(149 205 254 / 0.4);
    transform: translateX(-50%);
  }

  .type-character {
    display: inline-block;
    opacity: 0;
    transform: translateY(0.45em);
    animation: type-character-in 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes final-fortune {
    from {
      transform: scale(1.08);
      opacity: 0.75;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes type-character-in {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
