<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import FortunePanel from './FortunePanel.svelte';
  import ModeToggle from './ModeToggle.svelte';
  import PlayPanel from './PlayPanel.svelte';
  import QuizPanel from './QuizPanel.svelte';
  import { nextAppMode, type AppMode } from '../data/app-modes';

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

  const MODE_INTRO_MS = 420;
  const MODE_OUTRO_MS = 260;
  const fadeTransition = fade;
  const flyTransition = fly;
  const modeEasing = cubicOut;
  const videoSources = [
    { src: '/yuzhoulengmo_360p.webm', type: 'video/webm' },
    { src: '/yuzhoulengmo_360p.mp4', type: 'video/mp4' },
  ];

  type PlaybackState = 'Interactive' | 'VideoPlaying';

  let appMode: AppMode = 'fortune';
  let playbackState: PlaybackState = 'Interactive';
  let showModeToggle = true;
  let videoEl: HTMLVideoElement;
  let videoVisible = false;
  let videoArmed = false;
  let modeTransitionDirection = 1;
  let fadeOutTimer: ReturnType<typeof setTimeout>;

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  function toggleMode() {
    modeTransitionDirection = 1;
    appMode = nextAppMode(appMode);
  }

  function handleFeatureStart() {
    showModeToggle = false;
    armVideoPreload();
    safePlay(true);
  }

  function armVideoPreload(event?: Event) {
    if (videoArmed || !videoEl || (event && !event.isTrusted)) return;

    videoArmed = true;
    videoEl.preload = 'auto';

    const track = videoEl.querySelector('track');
    for (const { src, type } of videoSources) {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      videoEl.insertBefore(source, track);
    }

    videoEl.load();
  }

  function handleFirstInteraction(event: Event) {
    armVideoPreload(event);
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

  onMount(() => {
    const options = { capture: true, passive: true };

    window.addEventListener('pointerdown', handleFirstInteraction, options);
    window.addEventListener('keydown', handleFirstInteraction, options);

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction, options);
      window.removeEventListener('keydown', handleFirstInteraction, options);
    };
  });
</script>

<main
  class="relative flex h-full w-full items-center justify-center overflow-hidden bg-black text-white"
>
  {#if playbackState !== 'VideoPlaying'}
    <div transition:fadeTransition={{ duration: TIMING.UI_FADE_OUT_MS }}>
      <div class="mode-transition-stage">
        {#key appMode}
          <div
            class="mode-panel"
            in:flyTransition={{
              x: modeTransitionDirection * 30,
              y: 10,
              duration: MODE_INTRO_MS,
              easing: modeEasing,
              opacity: 0,
            }}
            out:flyTransition={{
              x: modeTransitionDirection * -30,
              y: -10,
              duration: MODE_OUTRO_MS,
              easing: modeEasing,
              opacity: 0,
            }}
          >
            {#if appMode === 'fortune'}
              <FortunePanel
                timing={TIMING}
                onStart={handleFeatureStart}
                onComplete={playVideoAfterFeature}
              />
            {:else if appMode === 'play'}
              <PlayPanel
                timing={TIMING}
                onStart={handleFeatureStart}
                onComplete={playVideoAfterFeature}
              />
            {:else}
              <QuizPanel onStart={handleFeatureStart} onComplete={playVideoAfterFeature} />
            {/if}
          </div>
        {/key}
      </div>
    </div>
  {/if}

  {#if playbackState !== 'VideoPlaying' && showModeToggle}
    <ModeToggle mode={appMode} onToggle={toggleMode} />
  {/if}

  <video
    bind:this={videoEl}
    id="fortune-video"
    preload="none"
    playsinline
    on:click={togglePlay}
    on:play={scheduleFadeOut}
    on:pause={clearFadeOut}
    on:ended={handleVideoEnded}
    class="fortune-video z-10 cursor-pointer transition-opacity ease-in"
    style:opacity={videoVisible ? '1' : '0'}
    style:pointer-events={videoVisible ? 'auto' : 'none'}
    style:transition-duration="{videoVisible
      ? TIMING.VIDEO_FADE_IN_MS
      : TIMING.VIDEO_FADE_OUT_MS}ms"
  >
    <track kind="captions" />
  </video>
</main>

<style>
  .fortune-video {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(100vw, 177.777778svh);
    max-width: none;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: contain;
    transform: translate(-50%, -50%);
  }

  @media (max-aspect-ratio: 40 / 27) {
    .fortune-video {
      width: 120vw;
    }
  }

  @media (min-aspect-ratio: 32 / 15) {
    .fortune-video {
      width: 213.333333svh;
    }
  }

  .mode-transition-stage {
    display: grid;
    width: 100%;
    min-height: min(78vh, 34rem);
    place-items: center;
  }

  .mode-panel {
    display: flex;
    grid-area: 1 / 1;
    width: 100%;
    justify-content: center;
    will-change: transform, opacity;
  }

  @media (max-width: 640px) {
    .mode-transition-stage {
      min-height: min(76vh, 38rem);
    }
  }
</style>
