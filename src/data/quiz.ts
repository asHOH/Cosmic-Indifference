import lyricsSource from './lyrics.txt?raw';
import distractorsSource from './lyric-distractors.txt?raw';
import { generateQuiz, parseQuizSources } from './quiz-generator';

export type { QuizOption, QuizQuestion } from './quiz-generator';

export const quizSources = parseQuizSources(lyricsSource, distractorsSource);

export function createQuiz() {
  return generateQuiz(quizSources);
}
