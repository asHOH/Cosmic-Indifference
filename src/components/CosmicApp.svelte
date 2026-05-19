<script lang="ts">
  import { fade } from 'svelte/transition';
  import FortunePanel from './FortunePanel.svelte';
  import ModeToggle from './ModeToggle.svelte';
  import QuizPanel from './QuizPanel.svelte';

  const TIMING = {
    ROLL_INTERVAL_MS: 35,
    ROLL_SLOWDOWN_MULTIPLIER: 1.15,
    ROLL_ITERATIONS: 20,
    FINAL_FORTUNE_ANIMATION_MS: 700,
    FORTUNE_LIFT_MS: 700,
    COMMENT_TYPE_INTERVAL_MS: 70,
    REVEAL_DURATION_MS: 3000, // Time to display the fortune
    UI_FADE_OUT_MS: 1000, // UI fade-out duration; video starts after this
    BLACK_DELAY_MS: 3000, // Delay before video starts to fade in
    VIDEO_FADE_IN_MS: 1000, // Video fade-in duration
    VIDEO_FADE_OUT_MS: 1000, // Video fade-out duration at the end
  };

  const fadeTransition = fade;

  type AppMode = 'fortune' | 'quiz';
  type PlaybackState = 'Interactive' | 'VideoPlaying';

  let appMode: AppMode = 'fortune';
  let playbackState: PlaybackState = 'Interactive';
  let showModeToggle = true;
  let videoEl: HTMLVideoElement;
  let videoVisible = false;
  let fadeOutTimer: ReturnType<typeof setTimeout>;

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  function toggleMode() {
    appMode = appMode === 'fortune' ? 'quiz' : 'fortune';
  }

  function handleFeatureStart() {
    showModeToggle = false;
    safePlay(true);
  }

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
        return;
      }
      console.warn('Playback failed:', error.name, error.message);
    }
  }

  async function playVideoAfterFeature() {
    playbackState = 'VideoPlaying';

    await delay(TIMING.UI_FADE_OUT_MS);

    videoEl && (videoEl.currentTime = 0);
    safePlay();

    await delay(TIMING.BLACK_DELAY_MS);
    videoVisible = true;
  }

  function togglePlay() {
    if (!videoEl || playbackState !== 'VideoPlaying') return;

    if (videoEl.paused) {
      videoEl.play();
    } else {
      videoEl.pause();
    }
  }

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
    await delay(TIMING.REVEAL_DURATION_MS + TIMING.UI_FADE_OUT_MS);

    videoEl && (videoEl.currentTime = 0);
    safePlay();

    await delay(TIMING.BLACK_DELAY_MS);
    videoVisible = true;
  }
</script>

<main
  class="relative flex h-full w-full items-center justify-center overflow-hidden bg-black text-white"
>
  {#if playbackState !== 'VideoPlaying'}
    <div transition:fadeTransition={{ duration: TIMING.UI_FADE_OUT_MS }}>
      {#if appMode === 'fortune'}
        <FortunePanel
          timing={TIMING}
          onStart={handleFeatureStart}
          onComplete={playVideoAfterFeature}
        />
      {:else}
        <QuizPanel onStart={handleFeatureStart} onComplete={playVideoAfterFeature} />
      {/if}
    </div>
  {/if}

  {#if playbackState !== 'VideoPlaying' && showModeToggle}
    <ModeToggle mode={appMode} onToggle={toggleMode} />
  {/if}

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
    <source src="/yuzhoulengmo_360p.webm" type="video/webm" />
    <source src="/yuzhoulengmo_360p.mp4" type="video/mp4" />
    <track kind="captions" />
  </video>
</main>
