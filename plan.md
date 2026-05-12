# Project Plan: 宇宙冷漠

## 0. Project Metadata
*   **Target Audience:** Mainland China users.
*   **Regulatory Status:** No ICP filing (deploying HTML to overseas/HK servers, outsourcing video to domestic platforms to bypass).
*   **Official Domain:** [https://www.yuzhoulengmo.com](https://www.yuzhoulengmo.com)
*   **Deployment Endpoint:** Tencent Cloud COS Hong Kong (Endpoint obfuscated for open-source; configure via environment variables/GitHub Secrets)
*   **Video Source:** Bilibili - 宇宙冷漠 ([https://www.bilibili.com/video/BV19X9eBpEfS](https://www.bilibili.com/video/BV19X9eBpEfS))

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

## 3. Video Delivery Strategy (Optimized for Mainland China & No ICP)
Given the constraints (Mainland China audience, zero bandwidth budget, and no ICP filing), hosting the raw video on foreign servers (like Cloudflare R2) will result in extremely slow buffering and a poor user experience. Meanwhile, domestic servers (like Tencent Cloud COS or Aliyun) require an ICP filing for custom domains and charge high egress bandwidth fees.

Therefore, the **only viable strategy** for smooth, zero-cost delivery is to leverage a domestic video platform's infrastructure.

### The Solution: Bilibili Invisible Iframe Buffering
*   **How it works:** You embed the Bilibili iframe inside your HTML on page load, but set it to `opacity: 0; pointer-events: none; z-index: -10;`. Bilibili's player and the initial video chunks load silently in the background while the user reads their fortune and interacts with the UI.
*   **Why it fits the constraints:** Bilibili pays for 100% of the video bandwidth, their CDN is lightning-fast across mainland China, and it requires no ICP filing from you (you are just an aggregator linking to them).
*   **Implementation Specs:**
    1.  **Anti-Hotlink Bypass:** Add `<meta name="referrer" content="no-referrer" />` to your Astro HTML `<head>` so Bilibili doesn't block the video playback on your site.
    2.  **The Embed:** Use the standard iframe: `<iframe id="bili-player" src="//player.bilibili.com/player.html?bvid=BV19X9eBpEfS&page=1&high_quality=1&danmaku=0" ...></iframe>`.
    3.  **The API Hook / Autoplay Fallback:** Bilibili's HTML5 player supports `window.postMessage` for control. When the user interacts with the Fortune button (which validates the browser's autoplay policies), you can send a `play` message to the iframe window. *Caveat/Fallback:* If Bilibili's message API is unresponsive, a bulletproof workaround is to dynamically append `&autoplay=1` to the iframe's `src` attribute exactly when the user clicks the "Roll Fortune" button.
    4.  **The Swap:** Once the `play` command is sent, wait exactly the designated ~1.5s reading time, and transition the iframe to `opacity: 1; pointer-events: auto;` using CSS.

## 4. Technical Architecture
*   **Frontend Framework:** Astro (for fast static HTML generation) + Svelte (for the interactive Fortune Generator state).
*   **State Management:** Define explicit states within the Svelte component: `Idle` -> `Rolling` -> `Revealed` -> `VideoTransitioning`.
*   **Transition Choreography:** Use Svelte's built-in `fade` transitions and CSS keyframes to handle the UI swap seamlessly.
*   **Deployment:** Static site hosting via Tencent Cloud COS (Hong Kong region, avoiding the ICP requirement). The lightweight HTML/JS bundle is served from your COS endpoint (mapped to `www.yuzhoulengmo.com`). Speeds in China will be perfectly acceptable, and the heavy video lifting is deferred to Bilibili.

## 5. Development Milestones
*   **Milestone 1:** Basic UI layout and Fortune randomization state machine (without video logic).
*   **Milestone 2:** Integrate the Bilibili iframe, configure the `no-referrer` bypass, and hide the player.
*   **Milestone 3:** Wire up the UI states to the Video player (Triggering `.play()` and sound after the rollout).
*   **Milestone 4:** CSS transition choreography (The smooth swap between the UI and Video).
*   **Milestone 5:** Cross-browser testing (Verify that iOS Safari and Chrome autoplay policies permit the sound after the interaction).
