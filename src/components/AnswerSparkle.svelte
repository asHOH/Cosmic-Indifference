<script lang="ts">
  const particles = Array.from({ length: 7 }, (_, index) => index);
</script>

<span class="answer-correct-particles" aria-hidden="true">
  {#each particles as particle}
    <span class="answer-correct-particle" style="--particle-index: {particle}"></span>
  {/each}
</span>

<style>
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
</style>
