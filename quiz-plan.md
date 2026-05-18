Another function of this web app: do a quiz for the song 宇宙冷漠.

## Overview

10 questions, 10 points each
All are multiple choice with 4 answer options (A, B, C, D) and exactly one answer

## What it quizzes

Questions 1~9 quiz the precise memory of the lyrics (precision, sequence).
Question 10 has 50% chance to quiz the singer; otherwise it also quizzes the lyrics.

## Source

`src/data/lyrics.txt` and `src/data/lyric-distractors.txt`
`lyrics.txt` contains the song lyrics.

- Each non-empty line is one lyric line
- Each line ending with `*` is sung by Kakaa (咔咔), not Cainonglaila (菜农来辣)
- Each line ending with `~` is somehow background-ish and is not considered an official lyric
- Strip trailing `*` when displaying or comparing lyrics. Do not strip `~`.

`lyric-distractors.txt` contains distractors used to generate wrong answer options.

- Each non-empty line corresponds to the lyric line at the same 1-based line number in `lyrics.txt`.
- Each line with only `-` means that this line should not be the target of the quiz.
- Each line with only a number means reuse the distractors from that 1-based line number.
- Each other line lists all possible distractors for the corresponding lyric line, separated by comma (`,`).
- Each distractor may have variants, denoted by `{a/b}`, where `{}` indicate the field of this variant, `/` separates variant options, and `a` and `b` stand for possible options. Multiple variants can appear in a single distractor. E.g. `{a/b}c{d/e/f}` stands for a distractor with 6 variants.
- Determine the distractor using weighted random. Weight = 2 + field_count. Then determine the variant using fair random.
- If the generated distractor variant is exactly the right answer, regenerate one.

## Questions to ask:

1. "“宇宙冷漠”这首歌的{第一句/最后一句}歌词是什么？" (Only if this question targets the first/last lyric)
2. "[lyric]的{上/下}一句是什么？" (Ensure uniqueness of that line of lyric; you may add another lyric to ensure uniqueness; omit any line that ends with `~` when asking this way)
3. "以下哪一句是咔咔唱的？" (only for the 10th question)
4. "以下哪一句歌词的{上/下}一句是“{芜~/嘎嘎嘎~}”？" (only for the 10th question)

For questions 1~9, first choose a random lyric to be the target of the quiz question, then choose one valid way to ask that question.

For the first/last lyric, choose between pattern 1 and the valid variant of pattern 2. For other lyrics, choose between the two variants of pattern 2.

When asking "{lyric}的下一句是什么？", if the previous line is not unique, try including the two previous lines as context. If there is only one line before it, switch to "{lyric}的上一句是什么？". Apply the same rule in the opposite direction when asking "{lyric}的上一句是什么？".

For question 10, choose between pattern 3 (singer question) and 4 (wu question).

The singer question answer options should include one random lyric line among all Kakaa-sung lines and two random lyric lines among all non-Kakaa-sung lines, avoiding every line ending with `~`.

The wu question answer options should include one random lyric line before/after a 芜~/嘎嘎嘎~ line and two random lyric lines among all non-Kakaa-sung lines, avoiding every line ending with `~`. Note that, when asking on "芜~", distraction option should not include the line before/after the two lines ending with "芜（轻）~", to ensure solid correct answer.

## Answer option generation

1. Option A is always "宇宙冷漠" regardless. This is intentional joke behavior, and in some cases it can be the right answer.
2. If option A is correct, options B~D come from three random lyric lines.
3. Otherwise, options B~D contain one right answer plus either two corresponding lyric distractors or two other random non-repeating lyric lines. Do not use 1 distractor + 1 random lyric line.
4. For singer questions, options B~D follow the singer-question answer option rule above. Preserve the invariant that exactly one answer option is correct.
