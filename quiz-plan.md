# Quiz Plan: for the song 宇宙冷漠

10 multiple-choice questions, 10 points each. Each question has 4 answer options (A-D) and exactly one correct answer.

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

## Question Selection

Questions 1-9 test lyric memory. Pick a random target lyric line, then ask one valid pattern:

1. `"“宇宙冷漠”这首歌的{第一句/最后一句}歌词是什么？"`: only for the first/last lyric line.
2. `"[lyric]的{上/下}一句歌词是什么？"`: omit `~` lines; the prompt lyric must identify a unique position.

For pattern 2, if the prompt line is not unique, add one more neighboring context line. If the target is too close to the start/end to do that, switch direction.

Question 10 chooses one special pattern with equal probability:

1. `"以下哪一句歌词是由咔咔唱的？"`: correct option is a random Kakaa-sung line; distractors are non-`~` non-Kakaa lines.
2. `"以下哪一句歌词的{上/下}一句是“{芜~/嘎嘎嘎~}”？"`: choose marker (`芜~` or `嘎嘎嘎~`) and direction (`上` or `下`). Correct option is a random non-`~` line whose previous/next line exactly matches the marker; distractors are non-`~` lines that do not match that marker/direction. For marker `芜~`, exclude lines next to `芜（轻）~` from distractors.

## Answer Options

Option A is always `"宇宙冷漠"` as intentional joke behavior; it may be correct.

- If A is correct, B-D are three random non-repeating lyric lines.
- Otherwise, B-D contain the correct answer plus either two matching distractors or two random non-repeating lyric lines. Do not mix one distractor with one random lyric line.
- For question 10, B-D follow the selected special pattern's correct/distractor pools.
- Always preserve exactly one correct option.
