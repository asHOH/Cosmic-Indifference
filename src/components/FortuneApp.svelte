<script lang="ts">
  import { fade } from 'svelte/transition';
  import RollButton from './RollButton.svelte';

  // Animation and timing configurations
  const TIMING = {
    ROLL_INTERVAL_MS: 50,
    ROLL_ITERATIONS: 20,
    REVEAL_DURATION_MS: 3000, // Time to display the fortune
    UI_FADE_OUT_MS: 1000, // UI fade-out duration; video starts after this
    BLACK_DELAY_MS: 3000, // Delay before video starts to fade in
    VIDEO_FADE_IN_MS: 1000, // Video fade-in duration
    VIDEO_FADE_OUT_MS: 1000, // Video fade-out duration at the end
  };

  type State = 'Idle' | 'Rolling' | 'Revealed' | 'VideoPlaying';
  let state: State = 'Idle';

  import { fortunes, type Fortune } from '../data/fortunes';
  let currentFortune: Fortune | null = null;
  let videoEl: HTMLVideoElement;
  let videoVisible = false;

  // centralized play handler
  async function safePlay(isPrewarm = false) {
    if (!videoEl) return;
    try {
      await videoEl.play();
      if (isPrewarm) {
        videoEl.pause();
        videoEl.currentTime = 0;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Expected if pause() is called before play() finishes. Safe to ignore.
        return;
      }
      console.warn('Playback failed:', error.name, error.message);
    }
  }

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const totalWeight = fortunes.reduce((sum, fortune) => sum + (fortune.weight ?? 1), 0);

  function randomFortune() {
    let roll = Math.random() * totalWeight;
    return (
      fortunes.find((fortune) => (roll -= fortune.weight ?? 1) <= 0) ??
      fortunes[fortunes.length - 1]
    );
  }

  async function rollFortune() {
    state = 'Rolling';
    safePlay(true); // Prewarm the video engine

    // Fake rolling animation
    for (let i = 0; i < TIMING.ROLL_ITERATIONS; i++) {
      currentFortune = randomFortune();
      await delay(TIMING.ROLL_INTERVAL_MS);
    }

    state = 'Revealed';

    // Wait for user to read the fortune
    await delay(TIMING.REVEAL_DURATION_MS);

    state = 'VideoPlaying';

    // Wait for UI to fade out
    await delay(TIMING.UI_FADE_OUT_MS);

    videoEl && (videoEl.currentTime = 0);
    safePlay();

    // Stay black before video fading in
    await delay(TIMING.BLACK_DELAY_MS);
    videoVisible = true;
  }

  function togglePlay() {
    if (!videoEl || state !== 'VideoPlaying') return;
    if (videoEl.paused) {
      videoEl.play();
    } else {
      videoEl.pause();
    }
  }

  let fadeOutTimer: ReturnType<typeof setTimeout>;

  function scheduleFadeOut() {
    clearTimeout(fadeOutTimer);
    if (!videoEl || Number.isNaN(videoEl.duration)) return;

    const remainingMs = (videoEl.duration - videoEl.currentTime) * 1000;
    const delayUntilFade = remainingMs - TIMING.VIDEO_FADE_OUT_MS;

    if (delayUntilFade > 0) {
      fadeOutTimer = setTimeout(() => {
        videoVisible = false;
      }, delayUntilFade);
    } else {
      videoVisible = false;
    }
  }

  function clearFadeOut() {
    clearTimeout(fadeOutTimer);
  }

  async function handleVideoEnded() {
    // Wait for 4s (Reveal + UI Fade out) before playing again
    await delay(TIMING.REVEAL_DURATION_MS + TIMING.UI_FADE_OUT_MS);

    videoEl && (videoEl.currentTime = 0);
    safePlay();

    // Keep screen black for another 3s, then start fade in
    await delay(TIMING.BLACK_DELAY_MS);
    videoVisible = true;
  }
</script>

<main
  class="relative flex h-full w-full items-center justify-center overflow-hidden bg-black text-white"
>
  <!-- Fortune UI -->
  {#if state !== 'VideoPlaying'}
    <div
      class="absolute z-20 flex flex-col items-center justify-center space-y-8"
      transition:fade={{ duration: TIMING.UI_FADE_OUT_MS }}
    >
      <h1 class="text-5xl font-bold tracking-widest text-[#95cdfe]">今日运势</h1>

      <div class="flex h-32 items-center justify-center text-6xl font-light">
        {#if (state === 'Rolling' || state === 'Revealed') && currentFortune}
          <span class="tracking-widest" style="color: {currentFortune.color}"
            >{currentFortune.name}
          </span>
        {/if}
      </div>

      <RollButton
        on:click={rollFortune}
        class={state !== 'Idle' ? 'pointer-events-none opacity-0' : 'opacity-100'}
        disabled={state !== 'Idle'}
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
    on:play={scheduleFadeOut}
    on:pause={clearFadeOut}
    on:ended={handleVideoEnded}
    class="absolute top-0 left-0 z-10 h-full w-full cursor-pointer object-cover transition-opacity ease-in"
    style:opacity={videoVisible ? '1' : '0'}
    style:pointer-events={videoVisible ? 'auto' : 'none'}
    style:transition-duration="{videoVisible
      ? TIMING.VIDEO_FADE_IN_MS
      : TIMING.VIDEO_FADE_OUT_MS}ms"
  >
    <!-- Browser tries WebM first -->
    <source src="/yuzhoulengmo_360p.webm" type="video/webm" />
    <!-- Fallback to MP4 if WebM is not supported -->
    <source src="/yuzhoulengmo_360p.mp4" type="video/mp4" />
    <track kind="captions" />
  </video>
</main>
