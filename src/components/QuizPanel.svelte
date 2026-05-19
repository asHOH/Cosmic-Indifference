<script lang="ts">
  import RollButton from './RollButton.svelte';

  export let onStart: () => void = () => {};

  let started = false;

  function startQuiz() {
    started = true;
    onStart();
  }
</script>

<div class="absolute z-20 flex flex-col items-center justify-center space-y-8 text-center">
  <h1 class="text-5xl font-bold tracking-widest text-[#95cdfe]">测试：宇宙冷漠</h1>

  <div class="quiz-stage flex min-h-52 flex-col items-center justify-center">
    {#if started}
      <p class="placeholder-text">题目正在坍缩成形</p>
    {/if}
  </div>

  <RollButton
    on:click={startQuiz}
    class={started ? 'pointer-events-none opacity-0' : 'opacity-100'}
    disabled={started}
  >
    我有所了解
  </RollButton>
</div>

<style>
  .quiz-stage {
    width: min(88vw, 720px);
  }

  .placeholder-text {
    color: rgb(255 255 255 / 0.6);
    font-size: clamp(1.125rem, 3.2vw, 1.5rem);
    font-weight: 300;
    line-height: 1.5;
    letter-spacing: 0.08em;
    text-shadow: 0 0 14px rgb(149 205 254 / 0.4);
  }
</style>
