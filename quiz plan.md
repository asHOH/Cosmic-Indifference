Another function of this web app: do a quiz for the song 宇宙冷漠.

## Overview

10 questions, 10 points each
All are multiple choice with 4 candidates (A, B, C, D) and exactly one answer

## What it quizes

Questions 1~9 quiz the precise memory of the lyrics (precision, sequence).
Question 10 has 50% chance to quiz the singer; otherwise it also quizzes the lyrics.

## Source

`src/data/lyric.txt` and `src/data/lyric confusion.txt`
`lyric.txt` reads the lyric of the song.

- Each non-empty line is a line of lyric
- Each line ending with `*` is sung by Kakaa (咔咔), not Cainonglaila (菜农来辣)
- Each line ending with `~` is somehow background-ish and is not considered an official lyric
- Strip trailing `*` when displaying or comparing lyrics. Do not strip `~`.

`lyric confusion.txt` contains confusion candidates that helps to generate a quiz.

- Each non-empty line represents all the confusion candidates for the corresponding line in `lyric.txt`.
- Each line with only `-` means that this line should not be the target of the quiz.
- Each line with only a number means reuse the confusion candidates from that 1-based line number.
- Each other line lists all possible confusion candidates when quizing the corresponding line, separated by comma (`,`).
- Each candidate may have variants, denoted by `{a/b}`, where `{}` indicate the field of this variant, `/` separates variant options, and `a` and `b` stands for possible options. Multiple variants can appear in a single candidate. E.g. {a/b}c{d/e/f} stands for a candidate with 6 variants.
- Determine the candidate using weighted random. Weight = 2 + field_count. Then determine the variant using fair random.
- If the generated variant of a confusion candidate is exactly the right answer (so it is no longer the "confusion"), regenerate one.

## Questions to ask:

1. "“宇宙冷漠”这首歌的{第一句/最后一句}歌词是什么？" (Only if this question targets the first/last lyric)
2. "{lyric}的{上/下}一句是什么？" (Ensure uniqueness of that line of lyric; you may add another lyric to ensure uniqueness; omit any line that ends with `~` when asking this way)
3. "以下哪一句是咔咔唱的？" (only for the 10th question)

For questions 1~9, first choose a random lyric to be the target of the quiz question, then choose one valid way to ask that question.

For the first/last lyric, choose between pattern 1 and the valid variant of pattern 2. For other lyrics, choose between the two variants of pattern 2.

When asking "{lyric}的下一句是什么？", if the previous line is not unique, try including the two previous lines as context. If there is only one line before it, switch to "{lyric}的上一句是什么？". Apply the same rule in the opposite direction when asking "{lyric}的上一句是什么？".

For question 10, use 50% chance to ask the singer question. The singer question candidates should include one random lyric among all Kakaa-sung lines and two random lyrics among all non-Kakaa-sung lines, avoiding every line ending with `~`.

## candidate generation

1. Candidate A is always "宇宙冷漠" regardless. This is intentional joke behavior, and in some cases it can be the right answer.
2. if A is correct, B~D comes from three random lyric.
3. otherwise, B~D comes from one right answer, plus two corresponding lyric confusions or plus two other random non-repeating lyric elsewhere. (Don't use 1 lyric confusion + 1 random lyric)
4. For singer questions, B~D follow the singer-question candidate rule above. Preserve the invariant that exactly one candidate is correct.
