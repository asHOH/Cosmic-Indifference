# Completed Project Spec: 宇宙冷漠

Status: completed and implemented in the current codebase.

## Product

`宇宙冷漠` is a static Astro + Svelte app with three interactive modes:

- `今日运势`: weighted fortune roll from `src/data/fortunes.toml`.
- `今天玩什么`: weighted play-option roll from `src/data/play-options.toml`.
- `测验：宇宙冷漠`: lyric quiz; completed details live in `quiz-plan.md`.

All modes lead into the same local `宇宙冷漠` video playback.

## UI Flow

- `src/components/CosmicApp.svelte` owns mode switching, video arming, and playback.
- `ModeToggle.svelte` cycles `fortune -> play -> quiz -> fortune` while the app is still interactive.
- `FortunePanel.svelte` and `PlayPanel.svelte` reuse `RollResultPanel.svelte`.
- Starting any mode hides the mode toggle and prewarms the video after user interaction.
- Roll modes animate through weighted entries, reveal an image/comment, then fade to the video.
- Quiz mode starts from `我有所了解`, runs the quiz, shows a result, then advances to the video.

## Assets And Data

- Video files are local HTML5 sources:
  - `public/yuzhoulengmo_360p.webm`
  - `public/yuzhoulengmo_360p.mp4`
- Roll result images are served from:
  - `public/fortunes/*.webp`
  - `public/play-options/*.webp`
- TOML roll data is parsed by `src/data/roll-result-entry.ts`.
- Image preprocessing commands live in `package.json`.

## Deployment

- Live domain: [https://www.yuzhoulengmo.com](https://www.yuzhoulengmo.com)
- Hosting target: Tencent Cloud COS Hong Kong.
- GitHub Actions workflow: `.github/workflows/deploy.yml`.
- Required secrets: `TENCENT_COS_SECRET_ID`, `TENCENT_COS_SECRET_KEY`, `TENCENT_COS_BUCKET`, `TENCENT_COS_REGION`.
