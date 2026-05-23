<script lang="ts">
  import RollResultPanel from './RollResultPanel.svelte';
  import { playOptionImagePath } from '../data/image-paths';
  import { playOptions } from '../data/play-options';

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
  title="今天玩什么"
  entries={playOptions}
  imagePath={playOptionImagePath}
  accentColor="#5eead4"
  {timing}
  {onStart}
  {onComplete}
/>
