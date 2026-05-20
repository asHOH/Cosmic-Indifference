<script lang="ts">
  import { RefreshCw } from '@lucide/svelte';

  export let mode: 'fortune' | 'quiz';
  export let onToggle: () => void = () => {};

  $: label = mode === 'fortune' ? '切换到测试' : '切换到运势';
</script>

<button
  type="button"
  class="mode-toggle fixed top-5 right-5 z-30 flex h-11 w-11 items-center justify-center transition hover:scale-105 hover:text-white focus:outline-none focus-visible:ring-2"
  class:quiz-mode={mode === 'quiz'}
  aria-label={label}
  title={label}
  on:click={onToggle}
>
  <RefreshCw aria-hidden="true" class="h-7 w-7" strokeWidth={2} />
</button>

<style>
  .mode-toggle {
    color: #95cdfe;
  }

  .mode-toggle:focus-visible {
    --tw-ring-color: #95cdfe;
  }

  .mode-toggle.quiz-mode {
    color: #ffd166;
  }

  .mode-toggle.quiz-mode:focus-visible {
    --tw-ring-color: #ffd166;
  }
</style>
