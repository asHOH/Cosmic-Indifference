<script lang="ts">
  import RollButton from './RollButton.svelte';
  import type { RollResultEntry } from '../data/roll-result-entry';

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

  export let title: string;
  export let entries: RollResultEntry[];
  export let imagePath: (name: string) => string;
  export let accentColor = '#95cdfe';
  export let buttonLabel = '占卜';
  export let debugEntryName = '';
  export let debugLabel = '';
  export let timing: FortuneTiming;
  export let onStart: () => void = () => {};
  export let onComplete: () => void | Promise<void> = () => {};

  let state: FortuneState = 'Idle';
  let currentEntry: RollResultEntry | null = null;
  let imageLoaded = false;
  let imageErrored = false;
  let typedComment = '';

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const showDebug = import.meta.env.DEV;

  $: totalWeight = entries.reduce((sum, entry) => sum + (entry.weight ?? 1), 0);
  $: debugEntry = debugEntryName
    ? entries.find((entry) => entry.name === debugEntryName)
    : undefined;

  function randomEntry() {
    let roll = Math.random() * totalWeight;
    return entries.find((entry) => (roll -= entry.weight ?? 1) <= 0) ?? entries[entries.length - 1];
  }

  async function typeComment(comment: string) {
    typedComment = '';
    for (const character of Array.from(comment)) {
      typedComment += character;
      await delay(timing.COMMENT_TYPE_INTERVAL_MS);
    }
  }

  async function rollEntry() {
    state = 'Rolling';
    imageLoaded = false;
    imageErrored = false;
    typedComment = '';
    onStart();

    let rollIntervalMs = timing.ROLL_INTERVAL_MS;
    for (let i = 0; i < timing.ROLL_ITERATIONS; i++) {
      currentEntry = randomEntry();
      await delay(rollIntervalMs);
      rollIntervalMs *= timing.ROLL_SLOWDOWN_MULTIPLIER;
    }

    state = 'Revealed';
    await delay(timing.FINAL_FORTUNE_ANIMATION_MS);

    await delay(timing.FORTUNE_LIFT_MS);

    if (currentEntry?.comment) {
      await typeComment(currentEntry.comment);
    }

    await delay(timing.REVEAL_DURATION_MS);
    await onComplete();
  }

  async function showDebugEntry() {
    if (!debugEntry) return;

    currentEntry = debugEntry;
    state = 'Revealed';
    imageLoaded = false;
    imageErrored = false;
    typedComment = '';

    if (debugEntry.comment) {
      await typeComment(debugEntry.comment);
    }
  }
</script>

<div
  class="fortune-shell relative z-20 flex flex-col items-center justify-center gap-8"
  class:reveal-layout={state === 'Revealed'}
  style="--result-accent: {accentColor}; --final-fortune-animation-ms: {timing.FINAL_FORTUNE_ANIMATION_MS}ms; --fortune-lift-ms: {timing.FORTUNE_LIFT_MS}ms"
>
  <h1 class="fortune-title text-5xl font-bold tracking-widest">{title}</h1>

  <div
    class="fortune-stage flex flex-col items-center justify-center text-center"
    class:stage-expanded={state === 'Revealed'}
  >
    {#if (state === 'Rolling' || state === 'Revealed') && currentEntry}
      <div class="fortune-reveal-stack">
        {#if state === 'Revealed' && !imageErrored}
          <div class="fortune-image-frame" aria-hidden="true">
            <div class="fortune-image-content">
              <img
                class="fortune-image"
                class:image-loaded={imageLoaded}
                src={imagePath(currentEntry.name)}
                alt=""
                decoding="async"
                on:load={() => (imageLoaded = true)}
                on:error={() => (imageErrored = true)}
              />
              {#if currentEntry.artist && currentEntry.artist_link}
                <a
                  class="fortune-artist-credit"
                  href={currentEntry.artist_link}
                  target="_blank"
                  rel="noreferrer">@{currentEntry.artist}</a
                >
              {/if}
            </div>
          </div>
        {/if}

        <div class="fortune-name-wrap">
          <span
            class="fortune-name tracking-widest"
            class:final-fortune={state === 'Revealed'}
            style="color: {currentEntry.color}"
            >{currentEntry.name}
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
    style="--roll-button-color: var(--result-accent); --roll-button-glow: color-mix(in srgb, var(--result-accent) 55%, transparent)"
    on:click={rollEntry}
    class={state !== 'Idle' ? 'pointer-events-none opacity-0' : 'opacity-100'}
    disabled={state !== 'Idle'}
  >
    {buttonLabel}
  </RollButton>

  {#if showDebug && debugEntry && debugLabel}
    <button
      type="button"
      class="fortune-debug-button"
      aria-label="Debug roll result preview"
      on:click={showDebugEntry}
    >
      {debugLabel}
    </button>
  {/if}
</div>

<style>
  .fortune-shell {
    --fortune-reveal-space: clamp(0.5rem, 1.2svh, 0.667rem);
    --fortune-text-shift: calc(var(--fortune-reveal-space) * 15);
    --fortune-image-gap: calc(var(--fortune-reveal-space) * 15);
    --fortune-image-height: calc(var(--fortune-reveal-space) * 18);
    --fortune-comment-gap: calc(var(--fortune-reveal-space) * 1.8);
  }

  .fortune-title {
    color: var(--result-accent);
    text-shadow: 0 0 20px color-mix(in srgb, var(--result-accent) 42%, transparent);
  }

  .fortune-debug-button {
    position: absolute;
    right: 0;
    bottom: -4.4rem;
    border: 1px solid color-mix(in srgb, var(--result-accent) 42%, transparent);
    border-radius: 999px;
    background: rgb(0 0 0 / 0.36);
    color: rgb(255 255 255 / 0.72);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 0.45rem 0.7rem;
    text-transform: uppercase;
  }

  .fortune-debug-button:hover {
    border-color: color-mix(in srgb, var(--result-accent) 78%, transparent);
    color: white;
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
    transform: translateY(var(--fortune-text-shift));
  }

  .fortune-image-frame {
    position: absolute;
    bottom: calc(100% + var(--fortune-image-gap));
    left: 50%;
    width: min(50vw, 15rem);
    height: var(--fortune-image-height);
    min-height: 6rem;
    transform: translateX(-50%);
  }

  .fortune-image {
    display: block;
    max-width: 100%;
    max-height: 100%;
    opacity: 0;
    filter: drop-shadow(0 0 1.25rem color-mix(in srgb, var(--result-accent) 28%, transparent));
    transform: translateY(0.9rem) scale(0.96);
    transition:
      opacity 520ms ease,
      transform 680ms cubic-bezier(0.16, 1, 0.3, 1),
      filter 680ms ease;
    transition-delay: 180ms;
  }

  .fortune-image-content {
    display: grid;
    position: relative;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    place-items: end center;
  }

  .fortune-artist-credit {
    position: absolute;
    bottom: 0;
    left: calc(100% + 0.5rem);
    color: rgb(255 255 255 / 0.52);
    font-size: 0.75rem;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
  }

  .fortune-artist-credit:hover {
    color: rgb(255 255 255 / 0.78);
    text-decoration: underline;
  }

  .image-loaded {
    opacity: 1;
    filter: drop-shadow(0 0 1.6rem color-mix(in srgb, var(--result-accent) 36%, transparent));
    transform: translateY(0) scale(1);
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
    top: calc(100% + var(--fortune-comment-gap));
    left: 50%;
    width: min(78vw, 36rem);
    min-height: 2.25rem;
    margin: 0;
    color: rgb(255 255 255 / 0.6);
    font-size: clamp(1.125rem, 3.2vw, 1.5rem);
    font-weight: 300;
    line-height: 1.5;
    letter-spacing: 0.08em;
    text-shadow: 0 0 14px color-mix(in srgb, var(--result-accent) 40%, transparent);
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
    .fortune-shell {
      --fortune-reveal-space: clamp(0.42rem, 1svh, 0.6rem);
    }

    .stage-expanded {
      min-height: clamp(18rem, 64svh, 28rem);
    }

    .fortune-image-frame {
      width: min(42vw, 11rem);
      min-height: 5.75rem;
    }
  }
</style>
