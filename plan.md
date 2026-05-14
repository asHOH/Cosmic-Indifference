# Project Plan: 宇宙冷漠

## 0. Project Metadata
*   **Target Audience:** Mainland China users.
*   **Regulatory Status:** No ICP filing.
*   **Official Domain:** [https://www.yuzhoulengmo.com](https://www.yuzhoulengmo.com)
*   **Deployment Endpoint:** Tencent Cloud COS Hong Kong (Endpoint obfuscated for open-source; configure via environment variables/GitHub Secrets)
*   **Required GitHub Secrets for Deployment:** `TENCENT_COS_SECRET_ID`, `TENCENT_COS_SECRET_KEY`, `TENCENT_COS_BUCKET` (e.g., `my-website-1250000000`), `TENCENT_COS_REGION` (e.g., `ap-hongkong`)
*   **Video Source:** Local Video Asset (MP4/WebM hosted alongside the site)

## 1. Product Overview & Core Concept
*   **Hook:** A classic "Daily Fortune" (今日运势) interactive web page.
*   **Punchline:** Regardless of result, it inevitably triggers the "宇宙冷漠" video.
*   **Vibe:** Minimalist, smooth, and slightly existential.

## 2. User Flow & UX/UI Specification
*   **Phase 1: Setup (Initial State)**
    *   UI exclusively displays the Fortune Generator (a button/shaker).
    *   Video is completely hidden, but begins preloading.
*   **Phase 2: Interaction**
    *   User clicks "Roll Fortune".
    *   A brief fake rolling animation plays.
    *   A random fortune text is presented to the user.
*   **Phase 3: Inevitability (Transition)**
    *   A ~1.5 second pause for reading the fortune.
    *   The Fortune UI transitions/fades out smoothly.
    *   The "宇宙冷漠" video fades in, taking over the screen.

## 3. Video Delivery Strategy

### The Solution: HTML5 `<video>`
*   **Target Resolution:** The 3-minute video is compressed to 360p (WebM or MP4/H.264) using `ffmpeg` to ~8MB.
```bash
    ffmpeg -y -i public/yuzhoulengmo.mp4 -vf scale=-2:360 -r 24 -c:v libvpx-vp9 -crf 32 -b:v 200k -row-mt 1 -c:a libopus -b:a 128k public/yuzhoulengmo_360p.webm
    ffmpeg -y -i public/yuzhoulengmo.mp4 -vf scale=-2:360 -r 24 -c:v libx264 -preset veryslow -crf 26 -c:a aac -b:a 128k -movflags +faststart public/yuzhoulengmo_360p.mp4
```

### Evaluated & Eliminated Candidates
*   **HLS (HTTP Live Streaming):** Over-engineering for a ~8MB payload. Adding `hls.js` parses manifests and fetches discrete chunks adds unnecessary time-to-first-frame latency.
*   **MPEG-DASH:** Same overhead latency/complexity as HLS, with added drawback of poor out-of-the-box support on iOS Safari.

## 4. Technical Architecture
*   **Frontend Framework:** Astro (for fast static HTML generation) + Svelte (for the interactive Fortune Generator state).
*   **Deployment:** Github actions deploying to static site hosting via Tencent Cloud COS (Hong Kong region, avoiding the ICP requirement).
