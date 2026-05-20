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
  type PhysicsParticle = {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    rotation: number;
    spin: number;
    hue: number;
    life: number;
    maxLife: number;
    bounce: number;
    shape: 'circle' | 'rect' | 'triangle';
  };

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
  const PERFECT_PHYSICS_PARTICLE_COUNT = 260;
  const PERFECT_PHYSICS_GRAVITY = 0.46;
  const PERFECT_PHYSICS_FRICTION = 0.992;
  const PERFECT_PHYSICS_LIFE_MS = 5400;

  let perfectLayer: HTMLDivElement | undefined;
  let physicsCanvas: HTMLCanvasElement | undefined;
  let physicsContext: CanvasRenderingContext2D | null = null;
  let physicsFrame: number | undefined;
  let physicsParticles: PhysicsParticle[] = [];
  let physicsStarted = false;

  function clearConfettiTimers() {
    while (confettiTimers.length > 0) {
      clearTimeout(confettiTimers.pop());
    }
  }

  function mountInDocument(node: HTMLCanvasElement) {
    document.body.appendChild(node);

    return {
      destroy() {
        node.remove();
      },
    };
  }

  function fireCupConfetti(options: ConfettiOptions) {
    confettiInstance?.({
      colors: cupConfettiColors,
      decay: 0.89,
      disableForReducedMotion: true,
      scalar: 1.45,
      ticks: 420,
      zIndex: 30,
      ...options,
    });
  }

  function launchPerfectConfetti() {
    clearConfettiTimers();

    fireCupConfetti({
      particleCount: 220,
      spread: 120,
      startVelocity: 98,
      gravity: 1.34,
      origin: { x: 0.5, y: 0.48 },
    });

    confettiTimers.push(
      setTimeout(() => {
        fireCupConfetti({
          angle: 76,
          particleCount: 150,
          spread: 88,
          startVelocity: 92,
          gravity: 1.26,
          origin: { x: 0.46, y: 0.48 },
        });
      }, 180)
    );

    confettiTimers.push(
      setTimeout(() => {
        fireCupConfetti({
          angle: 104,
          particleCount: 150,
          spread: 88,
          startVelocity: 92,
          gravity: 1.26,
          origin: { x: 0.54, y: 0.48 },
        });
      }, 260)
    );

    confettiTimers.push(
      setTimeout(() => {
        fireCupConfetti({
          angle: 90,
          particleCount: 190,
          spread: 150,
          startVelocity: 86,
          gravity: 1.42,
          origin: { x: 0.5, y: 0.5 },
        });
      }, 430)
    );
  }

  function resizePhysicsCanvas() {
    if (!physicsCanvas || !physicsContext) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.ceil(width * pixelRatio);
    const nextHeight = Math.ceil(height * pixelRatio);

    if (physicsCanvas.width !== nextWidth || physicsCanvas.height !== nextHeight) {
      physicsCanvas.width = nextWidth;
      physicsCanvas.height = nextHeight;
      physicsCanvas.style.width = `${width}px`;
      physicsCanvas.style.height = `${height}px`;
    }

    physicsContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function cupOrigin() {
    const fallback = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.48,
    };

    if (!perfectLayer) return fallback;

    const rect = perfectLayer.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function createPhysicsParticles(): PhysicsParticle[] {
    const origin = cupOrigin();

    return Array.from({ length: PERFECT_PHYSICS_PARTICLE_COUNT }, (_, id) => {
      const launch = {
        angle: -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.85,
        speed: 22 + Math.random() * 24,
      };

      return {
        id,
        x: origin.x,
        y: origin.y,
        vx: Math.cos(launch.angle) * launch.speed + (Math.random() - 0.5) * 10,
        vy: Math.sin(launch.angle) * launch.speed - Math.random() * 12,
        radius: 5 + Math.random() * 11,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.42,
        hue: 34 + ((id * 41) % 322),
        life: PERFECT_PHYSICS_LIFE_MS * (0.76 + Math.random() * 0.28),
        maxLife: PERFECT_PHYSICS_LIFE_MS,
        bounce: 0.68 + Math.random() * 0.2,
        shape: id % 3 === 0 ? 'circle' : id % 3 === 1 ? 'rect' : 'triangle',
      };
    });
  }

  function drawPhysicsParticle(context: CanvasRenderingContext2D, particle: PhysicsParticle) {
    const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
    const glow = Math.min(0.95, alpha + 0.18);

    context.save();
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation);
    context.globalAlpha = alpha;
    context.shadowBlur = 18;
    context.shadowColor = `hsl(${particle.hue} 100% 68% / ${glow})`;
    context.fillStyle = `hsl(${particle.hue} 100% 66% / ${glow})`;

    if (particle.shape === 'circle') {
      context.beginPath();
      context.arc(0, 0, particle.radius, 0, Math.PI * 2);
      context.fill();
    } else if (particle.shape === 'triangle') {
      context.beginPath();
      context.moveTo(0, -particle.radius * 1.35);
      context.lineTo(particle.radius * 1.2, particle.radius);
      context.lineTo(-particle.radius * 1.2, particle.radius);
      context.closePath();
      context.fill();
    } else {
      context.fillRect(
        -particle.radius * 0.72,
        -particle.radius * 1.35,
        particle.radius * 1.44,
        particle.radius * 2.7
      );
    }

    context.restore();
  }

  function updatePhysicsParticle(particle: PhysicsParticle, width: number, height: number) {
    particle.vy += PERFECT_PHYSICS_GRAVITY;
    particle.vx *= PERFECT_PHYSICS_FRICTION;
    particle.vy *= PERFECT_PHYSICS_FRICTION;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.rotation += particle.spin;
    particle.life -= 16.7;

    if (particle.x < particle.radius) {
      particle.x = particle.radius;
      particle.vx *= -particle.bounce;
    } else if (particle.x > width - particle.radius) {
      particle.x = width - particle.radius;
      particle.vx *= -particle.bounce;
    }

    if (particle.y < particle.radius) {
      particle.y = particle.radius;
      particle.vy *= -particle.bounce;
    } else if (particle.y > height - particle.radius) {
      particle.y = height - particle.radius;
      particle.vy *= -particle.bounce;
    }
  }

  function renderPhysicsParticles() {
    if (!physicsContext) return;

    resizePhysicsCanvas();

    const width = window.innerWidth;
    const height = window.innerHeight;
    physicsContext.clearRect(0, 0, width, height);

    physicsParticles = physicsParticles.filter((particle) => particle.life > 0);

    for (const particle of physicsParticles) {
      updatePhysicsParticle(particle, width, height);
      drawPhysicsParticle(physicsContext, particle);
    }

    if (physicsParticles.length > 0) {
      physicsFrame = requestAnimationFrame(renderPhysicsParticles);
      return;
    }

    physicsFrame = undefined;
  }

  function clearPhysicsParticles() {
    if (physicsFrame !== undefined) {
      cancelAnimationFrame(physicsFrame);
      physicsFrame = undefined;
    }

    if (physicsCanvas && physicsContext) {
      physicsContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    physicsParticles = [];
    physicsStarted = false;
  }

  function launchPerfectPhysicsBurst() {
    if (!physicsCanvas) return;

    physicsContext = physicsCanvas.getContext('2d');
    if (!physicsContext) return;

    if (physicsFrame !== undefined) {
      cancelAnimationFrame(physicsFrame);
      physicsFrame = undefined;
    }

    physicsStarted = true;
    resizePhysicsCanvas();
    physicsParticles = createPhysicsParticles();
    physicsFrame = requestAnimationFrame(renderPhysicsParticles);
  }

  $: if (perfect && confettiInstance && !confettiStarted) {
    confettiStarted = true;
    launchPerfectConfetti();
  }

  $: if (perfect && physicsCanvas && !physicsStarted) {
    launchPerfectPhysicsBurst();
  }

  $: if (!perfect) {
    confettiStarted = false;
    clearConfettiTimers();
    clearPhysicsParticles();
  }

  onMount(() => {
    let cancelled = false;
    const handleResize = () => resizePhysicsCanvas();

    import('canvas-confetti').then(({ default: loadedConfetti }) => {
      if (!cancelled) {
        confettiInstance = loadedConfetti;
      }
    });

    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
    };
  });

  onDestroy(() => {
    clearConfettiTimers();
    clearPhysicsParticles();
  });
</script>

{#if perfect}
  <canvas
    use:mountInDocument
    bind:this={physicsCanvas}
    class="perfect-physics-canvas"
    aria-hidden="true"
  ></canvas>

  <div bind:this={perfectLayer} class="perfect-overdrive" aria-hidden="true">
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

  .perfect-physics-canvas {
    position: fixed;
    inset: 0;
    z-index: 29;
    width: 100vw;
    height: 100vh;
    mix-blend-mode: screen;
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
