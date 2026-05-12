<script lang="ts">
  import { fade } from "svelte/transition";

  type State = "Idle" | "Rolling" | "Revealed" | "VideoPlaying";
  let state: State = "Idle";

  const fortunes = ["大吉", "吉", "中吉", "小吉", "末吉", "凶", "大凶"];
  let currentFortune = "";

  const videoSrc =
    "//player.bilibili.com/player.html?bvid=BV19X9eBpEfS&page=1&t=0.1&danmaku=0&autoplay=1";

  function rollFortune() {
    state = "Rolling";

    // Fake rolling animation
    let rollTarget = 20;
    let currentRoll = 0;

    const interval = setInterval(() => {
      currentFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      currentRoll++;
      if (currentRoll >= rollTarget) {
        clearInterval(interval);
        state = "Revealed";

        // Wait 1.5 seconds for user to read the fortune
        setTimeout(() => {
          state = "VideoPlaying";
        }, 1500);
      }
    }, 50);
  }
</script>

<main
  class="w-full h-full relative flex items-center justify-center bg-black text-white overflow-hidden"
>
  <!-- Fortune UI -->
  {#if state !== "VideoPlaying"}
    <div
      class="z-20 flex flex-col items-center justify-center space-y-8 absolute"
      transition:fade={{ duration: 800 }}
    >
      <h1 class="text-5xl font-bold tracking-widest">今日运势</h1>

      <div class="h-32 flex items-center justify-center text-6xl font-light">
        {#if state === "Rolling" || state === "Revealed"}
          <span class="tracking-widest">{currentFortune}</span>
        {/if}
      </div>

      {#if state === "Idle"}
        <button
          on:click={rollFortune}
          class="px-8 py-3 border border-white hover:bg-white hover:text-black transition-colors duration-300 rounded-sm uppercase tracking-widest cursor-pointer"
        >
          抽取
        </button>
      {/if}
    </div>
  {/if}

  <!--
    Bilibili Player
    Mounted immediately on click.
    Kept invisible until state === 'VideoPlaying'.
  -->
  {#if state !== "Idle"}
    <iframe
      src={videoSrc}
      class="absolute top-0 left-0 w-full h-full border-none transition-opacity duration-5000 ease-in"
      style="opacity: {state === 'VideoPlaying'
        ? '1'
        : '0'}; pointer-events: {state === 'VideoPlaying'
        ? 'auto'
        : 'none'}; z-index: 10;"
      allow="autoplay; fullscreen; encrypted-media"
      title="宇宙冷漠"
    ></iframe>
  {/if}
</main>
