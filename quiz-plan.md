# Completed Quiz Spec: 宇宙冷漠

Status: completed and implemented in the current codebase.

## UI

`QuizPanel.svelte` implements a 10-question multiple-choice quiz worth 10 points per question.

- Idle state title: `测验：宇宙冷漠`.
- Start button: `我有所了解`.
- Each question shows progress and four answer buttons.
- Answers are confirmed by holding for 500ms; the selected button fills while held.
- After confirmation, the quiz waits 700ms and advances.
- After question 10, the result screen shows score, badge, random comment, and celebration.
- The advance button appears after 1.5s and fades the app into the shared video flow.
- In dev mode, `Debug Perfect` previews the perfect-score result.

## Results

Result comments come from `src/data/quiz-result-comments.toml` through `src/data/quiz-result-comments.ts`.

Score buckets:

- `0-50`
- `60`
- `70`
- `80`
- `90`
- `100`

Badges:

- 0-50: `💩`
- 60: `👍`
- 70-100: trophy with bronze/silver/gold/perfect styling

Scores 60-99 get a modest particle celebration. A perfect score gets the exaggerated perfect-score effect.

## Data

Quiz source files:

- `src/data/lyrics.txt`
- `src/data/lyric-distractors.txt`
- `src/data/quiz-generator.ts`
- `src/data/quiz.ts`

Lyrics rules:

- One non-empty lyric line per row.
- Trailing `*` marks a Kakaa line and is stripped for display/comparison.
- Trailing `~` marks a background/interjection line and is kept in the displayed text.

Distractor rules:

- `lyric-distractors.txt` aligns 1:1 with `lyrics.txt`.
- `-` marks a lyric line as unavailable as a normal target.
- A number reuses distractors from that 1-based lyric line.
- Otherwise the row is a comma-separated list of distractor templates.
- `{a/b}` template fields are rendered randomly.
- Template weight is `2 + field_count`.
- Generated distractors cannot exactly match the correct answer or `宇宙冷漠`.

## Question Generation

`generateQuiz()` creates 9 lyric-memory questions plus 1 special question.

Lyric questions:

- Target official, non-background lyric lines.
- May ask for the first line, last line, previous line, or next line.
- Duplicate prompt lines get neighboring context when needed.
- Option A is always `宇宙冷漠`; it can be correct.
- If `宇宙冷漠` is not correct, the correct answer is shuffled into B-D with two matching distractors or two random lyric lines.

Special question 10:

- Either asks which line Kakaa sings.
- Or asks which line is adjacent to `芜~` or `嘎嘎嘎~`.
- Does not force option A to `宇宙冷漠`.
- Options are shuffled while preserving exactly one correct answer.
