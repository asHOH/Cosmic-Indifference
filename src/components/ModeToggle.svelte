<script lang="ts">
  import { RefreshCw } from '@lucide/svelte';

  export let mode: 'fortune' | 'quiz';
  export let onToggle: () => void = () => {};

  $: label = mode === 'fortune' ? '切换到测试' : '切换到运势';
</script>

<button
  type="button"
  class="fixed top-5 right-5 z-30 flex h-11 w-11 items-center justify-center text-[#95cdfe] transition hover:scale-105 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#95cdfe]"
  aria-label={label}
  title={label}
  on:click={onToggle}
>
  <RefreshCw aria-hidden="true" class="h-7 w-7" strokeWidth={2} />
</button>
