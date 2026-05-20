<script lang="ts">
  type Particle = {
    id: number;
    x: number;
    y: number;
    spin: number;
    delay: number;
    size: number;
    glyph: string;
  };

  export let particles: Particle[] = [];
  export let perfect = false;
</script>

{#if particles.length > 0}
  <div class="celebration-field" aria-hidden="true">
    {#each particles as particle (particle.id)}
      <span
        class="particle"
        class:perfect
        style="--x: {particle.x}px; --y: {particle.y}px; --spin: {particle.spin}deg; --delay: {particle.delay}ms; --size: {particle.size}"
      >
        {particle.glyph}
      </span>
    {/each}
  </div>
{/if}

<style>
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

  .particle.perfect {
    color: hsl(calc(var(--spin) + 220) 95% 72%);
    animation-duration: 900ms;
    text-shadow:
      0 0 12px currentColor,
      0 0 30px currentColor;
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
</style>
