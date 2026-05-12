<script lang="ts">
  import { fade } from "svelte/transition";

  type State = "Idle" | "Rolling" | "Revealed" | "VideoTransitioning";
  let state: State = "Idle";

  const fortunes = ["大吉", "吉", "中吉", "小吉", "末吉", "凶", "大凶"];
  let currentFortune = "";

  let iframeElement: HTMLIFrameElement;
  let videoSrc =
    "//player.bilibili.com/player.html?bvid=BV19X9eBpEfS&page=1&high_quality=1&danmaku=0";

  function rollFortune() {
    state = "Rolling";
    // Start autoplay attempt because user just interacted
    videoSrc =
      "//player.bilibili.com/player.html?bvid=BV19X9eBpEfS&page=1&high_quality=1&danmaku=0&autoplay=1";

    // Fake rolling animation
    let rollTarget = 20;
    let currentRoll = 0;

    const interval = setInterval(() => {
      currentFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      currentRoll++;
      if (currentRoll >= rollTarget) {
        clearInterval(interval);
        state = "Revealed";
        startVideoTransition();
      }
    }, 50);
  }

  function startVideoTransition() {
    setTimeout(() => {
      state = "VideoTransitioning";
      if (iframeElement && iframeElement.contentWindow) {
        // Try the postMessage API
        iframeElement.contentWindow.postMessage("play", "*");
      }
    }, 1500); // 1.5 seconds to read
  }
</script>

<main class="w-full h-full relative flex items-center justify-center">
  {#if state !== "VideoTransitioning"}
    <div
      class="z-10 flex flex-col items-center justify-center space-y-8"
      transition:fade={{ duration: 800 }}
    >
      <h1 class="text-4xl font-bold tracking-widest">今日运势</h1>

      <div class="h-32 flex items-center justify-center text-6xl font-light">
        {#if state === "Idle"}
          <span class="opacity-50 text-xl">点击下方按钮</span>
        {:else if state === "Rolling" || state === "Revealed"}
          <span class="tracking-widest">{currentFortune}</span>
        {/if}
      </div>

      {#if state === "Idle"}
        <button
          on:click={rollFortune}
          class="px-8 py-3 border border-white hover:bg-white hover:text-black transition-colors duration-300 rounded-sm uppercase tracking-widest"
        >
          抽取
        </button>
      {/if}
    </div>
  {/if}

  <!-- Bilibili Player -->
  <iframe
    bind:this={iframeElement}
    src={videoSrc}
    class="absolute top-0 left-0 w-full h-full border-none transition-opacity duration-1000"
    style="opacity: {state === 'VideoTransitioning'
      ? '1'
      : '0'}; pointer-events: {state === 'VideoTransitioning'
      ? 'auto'
      : 'none'}; z-index: {state === 'VideoTransitioning' ? '20' : '-10'};"
    allow="autoplay; fullscreen"
    title="宇宙冷漠"
  ></iframe>
</main>
