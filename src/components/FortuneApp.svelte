<script lang="ts">
  import { fade } from "svelte/transition";

  type State = "Idle" | "Rolling" | "Revealed" | "VideoPlaying";
  let state: State = "Idle";

  const fortunes = ["大吉", "吉", "中吉", "小吉", "末吉", "凶", "大凶"];
  let currentFortune = "";
  let videoEl: HTMLVideoElement;

  function rollFortune() {
    state = "Rolling";
    if (videoEl) {
      videoEl.play().catch(e => console.error("Video play failed:", e));
    }

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

  function togglePlay() {
    if (!videoEl || state !== "VideoPlaying") return;
    if (videoEl.paused) {
      videoEl.play();
    } else {
      videoEl.pause();
    }
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
    Local Video Player
    Mounted immediately, preloaded in background.
    Kept invisible until state === 'VideoPlaying'.
  -->
  <video
    bind:this={videoEl}
    id="fortune-video"
    src="/yuzhoulengmo_360p.webm"
    preload="auto"
    playsinline
    on:click={togglePlay}
    class="absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in cursor-pointer"
    style="opacity: {state === 'VideoPlaying'
      ? '1'
      : '0'}; pointer-events: {state === 'VideoPlaying'
      ? 'auto'
      : 'none'}; z-index: 10;"
  >
    <track kind="captions" />
  </video>
</main>
