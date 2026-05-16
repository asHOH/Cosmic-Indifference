# Project Plan: 宇宙冷漠

## 0. Project Metadata
*   **Target Audience:** Mainland China users.
*   **Regulatory Status:** No ICP filing.
*   **Official Domain:** [https://www.yuzhoulengmo.com](https://www.yuzhoulengmo.com)
*   **Deployment Endpoint:** Tencent Cloud COS Hong Kong
*   **Required GitHub Secrets for Deployment:** `TENCENT_COS_SECRET_ID`, `TENCENT_COS_SECRET_KEY`, `TENCENT_COS_BUCKET` (e.g., `my-website-1250000000`), `TENCENT_COS_REGION` (e.g., `ap-hongkong`)
*   **Video Source:** Local Asset (MP4, WebM)

## 1. Product Overview
*   **Hook:** A "Daily Fortune" (今日运势) interactive web page.
*   **Punchline:** Regardless of result, it triggers the "宇宙冷漠" video.
*   **Vibe:** Minimalist and smooth.

## 2. UX/UI Spec
*   **Phase 1: Setup**
    *   UI exclusively displays the Fortune Generator.
    *   Video preloads but is completely hidden.
*   **Phase 2: Interaction**
    *   User clicks "Roll Fortune".
    *   A rolling animation plays.
    *   A random fortune is presented along with image and comment.
*   **Phase 3: Transition**
    *   A pause for reading the fortune.
    *   The Fortune UI fades out.
    *   The "宇宙冷漠" video fades in, taking over.

## 3. Video Delivery

### The Solution: HTML5 `<video>`
*   **Target Resolution:** The 3-minute video is compressed to 360p (WebM or MP4/H.264) using `ffmpeg` to ~8MB.
```bash
    ffmpeg -y -i public/yuzhoulengmo.mp4 -vf scale=-2:360 -r 24 -c:v libvpx-vp9 -crf 32 -b:v 200k -row-mt 1 -c:a libopus -b:a 128k public/yuzhoulengmo_360p.webm
    ffmpeg -y -i public/yuzhoulengmo.mp4 -vf scale=-2:360 -r 24 -c:v libx264 -preset veryslow -crf 26 -c:a aac -b:a 128k -movflags +faststart public/yuzhoulengmo_360p.mp4
```

### Eliminated Candidates
*   **HLS (HTTP Live Streaming):** Over-engineering for a ~8MB payload. `hls.js` adds time-to-first-frame latency.
*   **MPEG-DASH:** Same overhead latency/complexity as HLS, with added drawback of compatibility.

## 4. Technical Architecture
*   **Frontend Framework:** Astro + Svelte
*   **Deployment:** Github actions deploying to static site hosting via Tencent Cloud COS (Hong Kong region, avoiding the ICP requirement).
