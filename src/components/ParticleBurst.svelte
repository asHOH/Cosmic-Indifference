<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type confetti from 'canvas-confetti';

  type Particle = {
    id: number;
    x: number;
    y: number;
    spin: number;
    delay: number;
    size: number;
    glyph: string;
  };
  type ConfettiOptions = NonNullable<Parameters<typeof confetti>[0]>;
  type ConfettiFunction = typeof confetti;

  export let particles: Particle[] = [];
  export let perfect = false;

  const shockwaves = [
    { id: 0, delay: 0, size: 0.8 },
    { id: 1, delay: 360, size: 1 },
    { id: 2, delay: 760, size: 1.2 },
  ];
  const beams = Array.from({ length: 12 }, (_, id) => ({
    id,
    angle: id * 30,
    delay: id * 28,
  }));
  const comets = Array.from({ length: 24 }, (_, id) => ({
    id,
    angle: id * 15,
    delay: 160 + (id % 8) * 58,
    size: 0.62 + (id % 5) * 0.13,
    travel: 165 + (id % 6) * 18,
  }));
  const confettiShards = Array.from({ length: 108 }, (_, id) => ({
    id,
    x: (id * 11) % 100,
    drift: ((id % 11) - 5) * 2.7,
    delay: 340 + (id % 24) * 24,
    duration: 1650 + (id % 7) * 115,
    hue: 38 + ((id * 47) % 280),
    spin: 180 + (id % 8) * 64,
  }));

  let confettiInstance: ConfettiFunction | undefined;
  let confettiStarted = false;
  const confettiTimers: ReturnType<typeof setTimeout>[] = [];
  const cupConfettiColors = ['#fff4bf', '#ffd166', '#ff4d8d', '#4de3ff', '#7cff6b', '#b38cff'];

  function clearConfettiTimers() {
    while (confettiTimers.length > 0) {
      clearTimeout(confettiTimers.pop());
    }
  }

  function fireCupConfetti(options: ConfettiOptions) {
    confettiInstance?.({
      colors: cupConfettiColors,
      decay: 0.91,
      disableForReducedMotion: true,
      scalar: 1.05,
      ticks: 260,
      zIndex: 30,
      ...options,
    });
  }

  function launchPerfectConfetti() {
    clearConfettiTimers();

    fireCupConfetti({
      particleCount: 120,
      spread: 92,
      startVelocity: 76,
      gravity: 1.12,
      origin: { x: 0.5, y: 0.48 },
    });

    confettiTimers.push(
      setTimeout(() => {
        fireCupConfetti({
          angle: 76,
          particleCount: 86,
          spread: 74,
          startVelocity: 68,
          gravity: 1.04,
          origin: { x: 0.46, y: 0.48 },
        });
      }, 180)
    );

    confettiTimers.push(
      setTimeout(() => {
        fireCupConfetti({
          angle: 104,
          particleCount: 86,
          spread: 74,
          startVelocity: 68,
          gravity: 1.04,
          origin: { x: 0.54, y: 0.48 },
        });
      }, 260)
    );
  }

  $: if (perfect && confettiInstance && !confettiStarted) {
    confettiStarted = true;
    launchPerfectConfetti();
  }

  $: if (!perfect) {
    confettiStarted = false;
    clearConfettiTimers();
  }

  onMount(() => {
    let cancelled = false;

    import('canvas-confetti').then(({ default: loadedConfetti }) => {
      if (!cancelled) {
        confettiInstance = loadedConfetti;
      }
    });

    return () => {
      cancelled = true;
    };
  });

  onDestroy(() => {
    clearConfettiTimers();
  });
</script>

{#if perfect}
  <div class="perfect-overdrive" aria-hidden="true">
    <div class="beam-wheel">
      {#each beams as beam}
        <span class="beam" style="--angle: {beam.angle}deg; --delay: {beam.delay}ms"></span>
      {/each}
    </div>

    {#each shockwaves as wave}
      <span class="shockwave" style="--delay: {wave.delay}ms; --wave-size: {wave.size}"></span>
    {/each}

    {#each comets as comet}
      <span
        class="comet"
        style="--angle: {comet.angle}deg; --delay: {comet.delay}ms; --size: {comet.size}; --travel: {comet.travel}px"
      ></span>
    {/each}

    <div class="confetti-rain">
      {#each confettiShards as shard}
        <span
          class="confetti-shard"
          style="--x: {shard.x}vw; --drift: {shard.drift}vw; --delay: {shard.delay}ms; --duration: {shard.duration}ms; --hue: {shard.hue}; --spin: {shard.spin}deg"
        ></span>
      {/each}
    </div>
  </div>
{/if}

{#if particles.length > 0 && !perfect}
  <div class="celebration-field" aria-hidden="true">
    {#each particles as particle (particle.id)}
      <span
        class="particle"
        style="--x: {particle.x}px; --y: {particle.y}px; --spin: {particle.spin}deg; --delay: {particle.delay}ms; --size: {particle.size}"
      >
        {particle.glyph}
      </span>
    {/each}
  </div>
{/if}

<style>
  .perfect-overdrive {
    position: absolute;
    inset: -42vh -32vw;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .celebration-field {
    position: absolute;
    inset: -40vh -30vw;
    z-index: 1;
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

  .beam-wheel {
    position: absolute;
    inset: 0;
    opacity: 0.82;
    animation: beam-wheel-spin 5200ms linear infinite;
    mix-blend-mode: screen;
  }

  .beam {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(58vw, 34rem);
    height: 0.18rem;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      transparent,
      hsl(calc(var(--angle) + 48) 100% 72% / 0.86),
      transparent
    );
    filter: blur(0.3px) drop-shadow(0 0 12px hsl(calc(var(--angle) + 48) 100% 72% / 0.8));
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--angle)) scaleX(0.2);
    animation: beam-flare 1180ms cubic-bezier(0.16, 1, 0.3, 1) infinite;
    animation-delay: var(--delay);
    transform-origin: center;
  }

  .shockwave {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(62vw, 34rem);
    aspect-ratio: 1;
    border: 2px solid rgb(255 255 255 / 0.75);
    border-radius: 999px;
    box-shadow:
      0 0 18px rgb(255 232 163 / 0.9),
      inset 0 0 26px rgb(var(--quiz-accent-rgb) / 0.32);
    opacity: 0;
    transform: translate(-50%, -50%) scale(calc(0.2 * var(--wave-size)));
    animation: shockwave-pulse 2100ms cubic-bezier(0.16, 1, 0.3, 1) infinite;
    animation-delay: var(--delay);
  }

  .comet {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(0.42rem * var(--size));
    height: calc(0.42rem * var(--size));
    border-radius: 999px;
    background: white;
    box-shadow:
      0 0 10px white,
      0 0 26px hsl(calc(var(--angle) + 80) 100% 68%);
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0);
    animation: comet-launch 980ms cubic-bezier(0.16, 1, 0.3, 1) infinite;
    animation-delay: var(--delay);
  }

  .comet::after {
    position: absolute;
    top: 50%;
    right: 0;
    width: 3.3rem;
    height: 0.12rem;
    border-radius: 999px;
    content: '';
    background: linear-gradient(90deg, transparent, hsl(calc(var(--angle) + 80) 100% 68% / 0.72));
    transform: translateY(-50%);
  }

  .confetti-rain {
    position: absolute;
    inset: 0;
  }

  .confetti-shard {
    position: absolute;
    top: -12%;
    left: var(--x);
    width: 0.36rem;
    height: 0.92rem;
    border-radius: 0.12rem;
    background: hsl(var(--hue) 100% 66%);
    box-shadow: 0 0 12px hsl(var(--hue) 100% 66% / 0.82);
    opacity: 0;
    transform: translate3d(0, 0, 0) rotate(0deg);
    animation: confetti-fall var(--duration) cubic-bezier(0.12, 0.76, 0.4, 1) infinite;
    animation-delay: var(--delay);
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

  @keyframes beam-wheel-spin {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes beam-flare {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) rotate(var(--angle)) scaleX(0.12);
    }

    18%,
    46% {
      opacity: 0.92;
      transform: translate(-50%, -50%) rotate(var(--angle)) scaleX(1);
    }

    100% {
      opacity: 0;
      transform: translate(-50%, -50%) rotate(var(--angle)) scaleX(1.2);
    }
  }

  @keyframes shockwave-pulse {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(calc(0.2 * var(--wave-size)));
    }

    10% {
      opacity: 0.9;
    }

    68%,
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(calc(1.75 * var(--wave-size)));
    }
  }

  @keyframes comet-launch {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(0.3);
    }

    16% {
      opacity: 1;
    }

    100% {
      opacity: 0;
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--travel)) scale(1.1);
    }
  }

  @keyframes confetti-fall {
    0% {
      opacity: 0;
      transform: translate3d(0, 0, 0) rotate(0deg);
    }

    10% {
      opacity: 1;
    }

    100% {
      opacity: 0;
      transform: translate3d(var(--drift), 128vh, 0) rotate(var(--spin));
    }
  }
</style>
