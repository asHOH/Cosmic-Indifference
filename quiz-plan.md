# Quiz Plan: for the song 宇宙冷漠

10 multiple-choice questions, 10 points each. Each question has 4 answer options (A-D) and exactly one correct answer.

## UI

Add a second app mode named `测试：宇宙冷漠`, parallel to the initial `今日运势` mode. A fixed borderless icon button toggles between the fortune and quiz modes. The toggle hides itself if one clicks the `占卜` button at `今日运势` mode or `我有所了解` (start the quiz) in this mode.

During the quiz, show one question at a time with progress, score, and four answer buttons. Long-press an answer button for ~500ms to confirm selection; show an easing progress bar on the button background during the long press. After confirmation, advance to the next question.

After the quiz, show the score, result badge and a random comment. Result badges:

- 0-50: 💩
- 60: 👍
- 70: bronze trophy
- 80: silver trophy
- 90: gold trophy
- 100: diamond trophy

The random comment is selected from a corresponding comment pool (~3 comments for each score range). The pool is not set up yet.

Scores 60-99 get a modest celebration effect. A perfect score gets an extremely exaggerated and crazy celebration effect (this is intentional).

After showing the result for ~1.5s, show a right-arrow advance button.

After pressing this button, the UI fades, and like what happens in the fortune app, the `宇宙冷漠` video plays and fades in. Reuse the fortune app's video transition timings.

## Data

`src/data/lyrics.txt` contains one lyric line per non-empty line.

- Trailing `*`: sung by Kakaa (咔咔), not Cainonglaila (菜农来辣). Strip before display/comparison.
- Trailing `~`: background-ish interjection, not an official lyric. Do not strip.

`src/data/lyric-distractors.txt` aligns 1:1 with `lyrics.txt`.

- `-`: this lyric line cannot be a quiz target.
- Number only: reuse distractors from that 1-based lyric line.
- Otherwise: comma-separated distractors for this lyric line.
- Distractor variants use `{a/b}` fields. Example: `{a/b}c{d/e/f}` has 6 variants.
- Pick a distractor by weight `2 + field_count`, then pick each variant option uniformly.
- Regenerate if the final distractor exactly matches the correct answer.

## Question Selection and Answer Options

### Questions 1-9

Test lyric memory. Pick a random target lyric line, then ask one valid pattern:

1. `"“宇宙冷漠”这首歌的{第一句/最后一句}歌词是什么？"`: only for the first/last lyric line.
2. `"[lyric]的{上/下}一句歌词是什么？"`: omit `~` lines; the prompt lyric must identify a unique position.

For pattern 2, if the prompt line is not unique, add one more neighboring context line (For 下一句 prompts, add previous context; for 上一句 prompts, add next context). If the target is too close to the start/end to do that, switch direction.

- Option A is always `"宇宙冷漠"` as intentional joke behavior; it may be correct.
- If A is correct, B-D are 3 random non-repeating lyric lines.
- Otherwise, B-D contain the correct answer plus either 2 matching distractors or 2 random non-repeating lyric lines. Do not mix one distractor with one random lyric line.
- Always preserve exactly one correct option and shuffle option B-D.

### Question 10

Chooses one special pattern with equal probability:

1. `"以下哪一句歌词是由咔咔唱的？"`: correct option is a random Kakaa-sung line; distractors are 3 non-`~` non-Kakaa lines.
2. `"以下哪一句歌词的{上/下}一句是“{芜~/嘎嘎嘎~}”？"`: choose marker (`芜~` or `嘎嘎嘎~`) and direction (`上` or `下`). Correct option is a random non-`~` line whose previous/next line exactly matches the marker; distractors are non-`~` lines that do not match that marker/direction. If that line is not unique, add one more neighboring context line. For marker `芜~`, exclude lines previous/next to `芜（轻）~` from distractors to avoid near-correct answers.

- Do not enforce option A to `"宇宙冷漠"` for this question.
- Always preserve exactly one correct option and shuffle the options.
