<script lang="ts">
  import { fade } from "svelte/transition";
  import RollButton from "./RollButton.svelte";

  // Animation and timing configurations
  const TIMING = {
    ROLL_INTERVAL_MS: 50,
    ROLL_ITERATIONS: 20,
    REVEAL_DURATION_MS: 3000, // Time to display the fortune
    UI_FADE_OUT_MS: 1000, // UI fade-out duration; video starts after this
    BLACK_DELAY_MS: 3000, // Delay before video starts to fade in
    VIDEO_FADE_IN_MS: 1000, // Video fade-in duration
  };

  type State = "Idle" | "Rolling" | "Revealed" | "VideoPlaying";
  let state: State = "Idle";

  const fortunes = ["大吉", "吉", "中吉", "小吉", "末吉", "凶", "大凶"];
  let currentFortune = "";
  let videoEl: HTMLVideoElement;
  let videoVisible = false;

  function rollFortune() {
    state = "Rolling";
    if (videoEl) {
      videoEl
        .play()
        .then(() => {
          videoEl.pause();
          videoEl.currentTime = 0;
        })
        .catch((e) => console.error("Video play failed:", e));
    }

    // Fake rolling animation
    let currentRoll = 0;

    const interval = setInterval(() => {
      currentFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      currentRoll++;
      if (currentRoll >= TIMING.ROLL_ITERATIONS) {
        clearInterval(interval);
        state = "Revealed";

        // Wait for user to read the fortune
        setTimeout(() => {
          state = "VideoPlaying";

          // Wait for UI to fade out
          setTimeout(() => {
            if (videoEl) {
              videoEl.currentTime = 0;
              videoEl
                .play()
                .catch((e) => console.error("Video play failed:", e));
            }

            // Stay black before video fading in
            setTimeout(() => {
              videoVisible = true;
            }, TIMING.BLACK_DELAY_MS);
          }, TIMING.UI_FADE_OUT_MS);
        }, TIMING.REVEAL_DURATION_MS);
      }
    }, TIMING.ROLL_INTERVAL_MS);
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
      transition:fade={{ duration: TIMING.UI_FADE_OUT_MS }}
    >
      <h1 class="text-5xl font-bold tracking-widest text-[#95cdfe]">
        今日运势
      </h1>

      <div class="h-32 flex items-center justify-center text-6xl font-light">
        {#if state === "Rolling" || state === "Revealed"}
          <span class="tracking-widest">{currentFortune}</span>
        {/if}
      </div>

      <RollButton
        on:click={rollFortune}
        class={state !== "Idle"
          ? "opacity-0 pointer-events-none"
          : "opacity-100"}
        disabled={state !== "Idle"}
      >
        抽取
      </RollButton>
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
    preload="auto"
    playsinline
    on:click={togglePlay}
    class="absolute top-0 left-0 w-full h-full object-cover transition-opacity ease-in cursor-pointer"
    style="opacity: {videoVisible ? '1' : '0'}; pointer-events: {state ===
    'VideoPlaying'
      ? 'auto'
      : 'none'}; transition-duration: {TIMING.VIDEO_FADE_IN_MS}ms; z-index: 10;"
  >
    <!-- Browser tries WebM first -->
    <source src="/yuzhoulengmo_360p.webm" type="video/webm" />
    <!-- Fallback to MP4 if WebM is not supported -->
    <source src="/yuzhoulengmo_360p.mp4" type="video/mp4" />
    <track kind="captions" />
  </video>
</main>
