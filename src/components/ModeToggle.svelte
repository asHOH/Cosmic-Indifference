<script lang="ts">
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
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    class="h-7 w-7"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M17 2v5h-5" />
    <path d="M7 22v-5h5" />
    <path d="M18.8 9A7 7 0 0 0 7.2 5.2L12 7" />
    <path d="M5.2 15A7 7 0 0 0 16.8 18.8L12 17" />
  </svg>
</button>
