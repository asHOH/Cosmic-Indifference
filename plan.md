# Project Plan: 宇宙冷漠

## 0. Project Metadata
*   **Target Audience:** Mainland China users.
*   **Regulatory Status:** No ICP filing (deploying HTML to overseas/HK servers, outsourcing video to domestic platforms to bypass).
*   **Official Domain:** [https://www.yuzhoulengmo.com](https://www.yuzhoulengmo.com)
*   **Deployment Endpoint:** Tencent Cloud COS Hong Kong (Endpoint obfuscated for open-source; configure via environment variables/GitHub Secrets)
*   **Video Source:** Local Video Asset (MP4/WebM hosted alongside the site)

## 1. Product Overview & Core Concept
*   **The Hook:** A classic "Daily Fortune" (今日运势) interactive web page.
*   **The Punchline:** Regardless of the result (Good, Bad, Neutral), it inevitably triggers the "宇宙冷漠" video.
*   **Vibe:** Minimalist, smooth, and slightly existential.

## 2. User Flow & UX/UI Specification
*   **Phase 1: The Setup (Initial State)**
    *   UI exclusively displays the Fortune Generator (a button/shaker).
    *   Video player is completely hidden (opacity 0) in the background so it doesn't distract the user.
    *   *Background Task:* Video resource begins silent preloading immediately upon page visit.
*   **Phase 2: The Interaction**
    *   User interacts by clicking "Roll Fortune".
    *   A brief fake loading/rolling animation plays to build anticipation.
    *   A random fortune text is presented to the user.
*   **Phase 3: The Inevitability (Transition)**
    *   A ~1.5 second pause allows the user to register the fortune they received.
    *   The Fortune UI transitions/fades out smoothly.
    *   The "宇宙冷漠" video fades in (opacity 0 to 1) taking over the screen.
    *   The video auto-plays with sound (browser autoplay policies enable this because the user previously interacted with the "Roll Fortune" button).

## 3. Video Delivery Strategy (Optimized for Customization & No ICP)
Relying on third-party video platforms restricts customization (UI overlays, playback control, focus hijacking). Therefore, we adopt a **Local Video Hosting Strategy**.

### The Solution: Optimized 360p Progressive HTML5 `<video>`
*   **Target Resolution & File Size:** The 3-minute video will be compressed to 360p (WebM or MP4/H.264) using `ffmpeg` with `faststart` (`-movflags +faststart`). This brings the payload down to ~4MB even for full-file downloads.
*   **How it works:** The web-optimized video file is served statically from the `public/` directory via a standard HTML5 `<video>` tag. We preload the video silently using `preload="auto"`.
*   **Implementation Specs:**
    1.  **The Embed:** `<video id="fortune-video" src="/assets/yuzhoulengmo_360p.mp4" preload="auto" playsinline></video>`.
    2.  **The Play Trigger:** When the user clicks the "Roll Fortune" button (satisfying browser autoplay policies), we programmatically call `.play()` on the hidden video.
    3.  **The Swap:** After the fortune reading time elapses, CSS transitions fade out the UI and fade in the video to 100% opacity for a seamless visual handoff.

### Evaluated & Eliminated Candidates
*   **HLS (HTTP Live Streaming):** Over-engineering for a ~3MB payload. Adding `hls.js` increases JS bundle size (~100kb), while parsing manifests and fetching discrete chunks adds unnecessary time-to-first-frame latency.
*   **MPEG-DASH:** Suffers the same overhead latency/complexity as HLS, with the critical added drawback of poor out-of-the-box support on iOS Safari.

## 4. Technical Architecture
*   **Frontend Framework:** Astro (for fast static HTML generation) + Svelte (for the interactive Fortune Generator state).
*   **State Management:** Define explicit states within the Svelte component: `Idle` -> `Rolling` -> `Revealed` -> `VideoTransitioning`.
*   **Transition Choreography:** Use Svelte's built-in `fade` transitions and CSS keyframes to handle the UI swap seamlessly.
*   **Deployment:** Static site hosting via Tencent Cloud COS (Hong Kong region, avoiding the ICP requirement). The lightweight HTML/JS bundle is served from your COS endpoint (mapped to `www.yuzhoulengmo.com`). Speeds in China will be perfectly acceptable, and the heavy video lifting is deferred to Bilibili.

## 5. Development Milestones
*   **Milestone 1:** Basic UI layout and Fortune randomization state machine (without video logic).
*   **Milestone 2:** Integrate the HTML5 video element, prioritize preloading, and hide the player.
*   **Milestone 3:** Wire up the UI states to the Video player (Triggering `.play()` and sound after the rollout).
*   **Milestone 4:** CSS transition choreography (The smooth swap between the UI and Video).
*   **Milestone 5:** Cross-browser testing (Verify that iOS Safari and Chrome autoplay policies permit the sound after the interaction).
