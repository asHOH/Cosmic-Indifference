<script lang="ts">
  import RollResultPanel from './RollResultPanel.svelte';
  import { fortunes } from '../data/fortunes';
  import { fortuneImagePath } from '../data/image-paths';

  type FortuneTiming = {
    ROLL_INTERVAL_MS: number;
    ROLL_SLOWDOWN_MULTIPLIER: number;
    ROLL_ITERATIONS: number;
    FINAL_FORTUNE_ANIMATION_MS: number;
    FORTUNE_LIFT_MS: number;
    COMMENT_TYPE_INTERVAL_MS: number;
    REVEAL_DURATION_MS: number;
  };

  export let timing: FortuneTiming;
  export let onStart: () => void = () => {};
  export let onComplete: () => void | Promise<void> = () => {};
</script>

<RollResultPanel
  title="今日运势"
  entries={fortunes}
  imagePath={fortuneImagePath}
  accentColor="#95cdfe"
  debugEntryName="超超超大吉"
  debugLabel="Debug Rare"
  {timing}
  {onStart}
  {onComplete}
/>
