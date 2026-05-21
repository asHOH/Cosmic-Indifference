<script lang="ts">
  import RollButton from './RollButton.svelte';
  import { fortuneImagePath } from '../data/fortune-images';
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
  let imageLoaded = false;
  let imageErrored = false;
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
    imageLoaded = false;
    imageErrored = false;
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

    await delay(timing.FORTUNE_LIFT_MS);

    if (currentFortune?.comment) {
      await typeComment(currentFortune.comment);
    }

    await delay(timing.REVEAL_DURATION_MS);
    await onComplete();
  }
</script>

<div
  class="fortune-shell relative z-20 flex flex-col items-center justify-center space-y-8"
  class:reveal-layout={state === 'Revealed'}
  style="--final-fortune-animation-ms: {timing.FINAL_FORTUNE_ANIMATION_MS}ms; --fortune-lift-ms: {timing.FORTUNE_LIFT_MS}ms"
>
  <h1 class="fortune-title text-5xl font-bold tracking-widest text-[#95cdfe]">今日运势</h1>

  <div
    class="fortune-stage flex flex-col items-center justify-center text-center"
    class:stage-expanded={state === 'Revealed'}
  >
    {#if (state === 'Rolling' || state === 'Revealed') && currentFortune}
      <div class="fortune-reveal-stack">
        {#if state === 'Revealed' && !imageErrored}
          <div class="fortune-image-frame" aria-hidden="true">
            <img
              class="fortune-image"
              class:image-loaded={imageLoaded}
              src={fortuneImagePath(currentFortune.name)}
              alt=""
              decoding="async"
              on:load={() => (imageLoaded = true)}
              on:error={() => (imageErrored = true)}
            />
          </div>
        {/if}

        <div class="fortune-name-wrap">
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
      </div>
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
  .fortune-title {
    transform: translateY(0);
    transition: transform var(--fortune-lift-ms) cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }

  .reveal-layout .fortune-title {
    transform: translateY(clamp(-6rem, -10svh, -4rem));
  }

  .fortune-stage {
    position: relative;
    width: min(88vw, 720px);
    min-height: 13rem;
    transition: min-height var(--fortune-lift-ms) cubic-bezier(0.22, 1, 0.36, 1);
  }

  .stage-expanded {
    min-height: clamp(18rem, 58svh, 30rem);
  }

  .fortune-reveal-stack {
    display: flex;
    position: relative;
    flex-direction: column;
    align-items: center;
    transform: translateY(0);
    transition: transform var(--fortune-lift-ms) cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }

  .fortune-name-wrap {
    min-height: 3.75rem;
  }

  .reveal-layout .fortune-reveal-stack {
    transform: translateY(clamp(1.25rem, 3svh, 2rem));
  }

  .fortune-image-frame {
    display: grid;
    position: absolute;
    bottom: calc(100% + clamp(7.5rem, 18svh, 10rem));
    left: 50%;
    width: min(50vw, 15rem);
    height: min(24svh, 11.5rem);
    min-height: 6rem;
    place-items: end center;
    transform: translateX(-50%);
  }

  .fortune-image {
    display: block;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    opacity: 0;
    filter: drop-shadow(0 0 1.25rem rgb(149 205 254 / 0.28));
    transform: translateY(0.9rem) scale(0.96);
    transition:
      opacity 520ms ease,
      transform 680ms cubic-bezier(0.16, 1, 0.3, 1),
      filter 680ms ease;
    transition-delay: 180ms;
  }

  .image-loaded {
    opacity: 1;
    filter: drop-shadow(0 0 1.6rem rgb(149 205 254 / 0.36));
    transform: translateY(0) scale(1);
    transition-delay: 180ms;
  }

  .fortune-name {
    display: inline-block;
    font-size: clamp(3rem, 9vw, 3.75rem);
    line-height: 1;
  }

  .final-fortune {
    animation: final-fortune var(--fortune-lift-ms) ease-out both;
    text-shadow: 0 0 18px currentColor;
  }

  .fortune-comment {
    white-space: pre-wrap;
    position: absolute;
    top: calc(100% + clamp(0.7rem, 2svh, 1.1rem));
    left: 50%;
    width: min(78vw, 36rem);
    min-height: 2.25rem;
    margin: 0;
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

  @media (max-height: 620px) {
    .stage-expanded {
      min-height: clamp(18rem, 64svh, 28rem);
    }

    .fortune-image-frame {
      width: min(42vw, 11rem);
      height: min(28svh, 11rem);
      min-height: 5.75rem;
    }
  }
</style>
