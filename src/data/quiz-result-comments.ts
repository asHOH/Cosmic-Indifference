import { parse } from 'smol-toml';
import commentsSource from './quiz-result-comments.toml?raw';

export const quizScoreBuckets = ['0-50', '60', '70', '80', '90', '100'] as const;

export type QuizScoreBucket = (typeof quizScoreBuckets)[number];

export type QuizResultComments = Record<QuizScoreBucket, string[]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function bucketForQuizScore(score: number): QuizScoreBucket {
  if (score >= 100) return '100';
  if (score >= 90) return '90';
  if (score >= 80) return '80';
  if (score >= 70) return '70';
  if (score >= 60) return '60';
  return '0-50';
}

export function parseQuizResultCommentsToml(source: string): QuizResultComments {
  const data = parse(source);
  const comments = {} as Partial<QuizResultComments>;

  if (!isRecord(data)) {
    throw new Error('quiz-result-comments.toml must contain score bucket tables');
  }

  for (const bucket of quizScoreBuckets) {
    const bucketData = data[bucket];
    if (!isRecord(bucketData) || !isStringArray(bucketData.comments)) {
      throw new Error(`Score bucket ${bucket} must define comments`);
    }

    if (bucketData.comments.length === 0) {
      throw new Error(`Score bucket ${bucket} must contain at least one comment`);
    }

    for (const comment of bucketData.comments) {
      if (typeof comment !== 'string') {
        throw new Error(`Score bucket ${bucket} comments must be strings`);
      }
    }

    comments[bucket] = bucketData.comments;
  }

  return comments as QuizResultComments;
}

export const quizResultComments = parseQuizResultCommentsToml(commentsSource);
