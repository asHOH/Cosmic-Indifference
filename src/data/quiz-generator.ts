export type QuizSinger = 'cainonglaila' | 'kakaa';

export type QuizLyric = {
  index: number;
  text: string;
  sourceText: string;
  singer: QuizSinger;
  background: boolean;
  distractorSpec: string;
};

export type ParsedQuizSources = {
  lyrics: QuizLyric[];
  targets: QuizLyric[];
};

export type QuizOption = {
  id: string;
  text: string;
  correct: boolean;
};

export type QuizQuestion = {
  prompt: string;
  answer: string;
  options: QuizOption[];
  kind: 'lyric' | 'special';
};

type Random = () => number;
type NeighborDirection = 'previous' | 'next';
type OptionContextSide = 'previous' | 'next';

const JOKE_ANSWER = '宇宙冷漠';
const KAKAA = 'kakaa';
const CAINONGLAILA = 'cainonglaila';
const BACKGROUND_SUFFIX = '~';
const KAKAA_SUFFIX = '*';
const QUESTION_COUNT = 10;
const LYRIC_QUESTION_COUNT = 9;

function nonEmptyLines(source: string) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripSingerMarker(line: string) {
  return line.endsWith(KAKAA_SUFFIX) ? line.slice(0, -1) : line;
}

function uniqueByText<T>(items: T[], getText: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const text = getText(item);
    if (seen.has(text)) return false;
    seen.add(text);
    return true;
  });
}

function randomIndex(length: number, random: Random) {
  return Math.min(Math.floor(random() * length), length - 1);
}

function pick<T>(items: T[], random: Random) {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty list');
  }

  return items[randomIndex(items.length, random)];
}

function shuffle<T>(items: T[], random: Random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, random);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function sampleUnique<T>(items: T[], count: number, random: Random, getText: (item: T) => string) {
  const candidates = shuffle(uniqueByText(items, getText), random);
  if (candidates.length < count) {
    throw new Error(`Need ${count} unique choices, found ${candidates.length}`);
  }

  return candidates.slice(0, count);
}

function textCounts(lyrics: QuizLyric[]) {
  return lyrics.reduce((counts, lyric) => {
    counts.set(lyric.text, (counts.get(lyric.text) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

function optionId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

function countVariantFields(template: string) {
  return Array.from(template.matchAll(/\{[^{}]+\/[^{}]+\}/g)).length;
}

function renderVariant(template: string, random: Random) {
  return template.replace(/\{([^{}]+)\}/g, (_match, group: string) => {
    const choices = group.split('/');
    return pick(choices, random);
  });
}

function splitTemplates(spec: string) {
  return spec
    .split(',')
    .map((template) => template.trim())
    .filter(Boolean);
}

function resolveDistractorTemplates(
  lyrics: QuizLyric[],
  lyricIndex: number,
  seen = new Set<number>()
): string[] {
  if (seen.has(lyricIndex)) return [];
  seen.add(lyricIndex);

  const spec = lyrics[lyricIndex]?.distractorSpec;
  if (!spec || spec === '-') return [];

  if (/^\d+$/.test(spec)) {
    const referencedIndex = Number(spec) - 1;
    return resolveDistractorTemplates(lyrics, referencedIndex, seen);
  }

  return splitTemplates(spec);
}

function weightedDistractor(templates: string[], random: Random) {
  const weighted = templates.map((template) => ({
    template,
    weight: 2 + countVariantFields(template),
  }));
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = random() * totalWeight;
  const picked =
    weighted.find((item) => {
      roll -= item.weight;
      return roll <= 0;
    }) ?? weighted[weighted.length - 1];

  return renderVariant(picked.template, random);
}

function buildMatchingDistractors(parsed: ParsedQuizSources, target: QuizLyric, random: Random) {
  const templates = resolveDistractorTemplates(parsed.lyrics, target.index);
  const distractors: string[] = [];
  let attempts = 0;

  while (templates.length > 0 && distractors.length < 2 && attempts < 80) {
    attempts += 1;
    const distractor = weightedDistractor(templates, random);
    if (
      distractor !== target.text &&
      distractor !== JOKE_ANSWER &&
      !distractors.includes(distractor)
    ) {
      distractors.push(distractor);
    }
  }

  return distractors;
}

function randomLyricOptions(
  parsed: ParsedQuizSources,
  count: number,
  random: Random,
  excludedTexts: string[]
) {
  const excluded = new Set(excludedTexts);
  return sampleUnique(
    parsed.lyrics.filter((lyric) => !lyric.background && !excluded.has(lyric.text)),
    count,
    random,
    (lyric) => lyric.text
  ).map((lyric) => lyric.text);
}

function makeOptionsForLyricQuestion(
  parsed: ParsedQuizSources,
  target: QuizLyric,
  random: Random
): QuizOption[] {
  if (target.text === JOKE_ANSWER) {
    return [
      { id: 'a', text: JOKE_ANSWER, correct: true },
      ...randomLyricOptions(parsed, 3, random, [target.text]).map((text, index) => ({
        id: optionId('random', index),
        text,
        correct: false,
      })),
    ];
  }

  const matchingDistractors = buildMatchingDistractors(parsed, target, random);
  const distractors =
    matchingDistractors.length >= 2
      ? matchingDistractors
      : randomLyricOptions(parsed, 2, random, [target.text, JOKE_ANSWER]);

  const shuffledRest = shuffle(
    [
      { id: 'correct', text: target.text, correct: true },
      ...distractors.map((text, index) => ({
        id: optionId('distractor', index),
        text,
        correct: false,
      })),
    ],
    random
  );

  return [{ id: 'a', text: JOKE_ANSWER, correct: false }, ...shuffledRest];
}

function isUniqueText(lyrics: QuizLyric[], lyric: QuizLyric) {
  return (textCounts(lyrics).get(lyric.text) ?? 0) === 1;
}

function officialLyrics(lyrics: QuizLyric[]) {
  return lyrics.filter((lyric) => !lyric.background);
}

function officialNeighbor(lyrics: QuizLyric[], startIndex: number, step: -1 | 1) {
  for (let index = startIndex + step; index >= 0 && index < lyrics.length; index += step) {
    const lyric = lyrics[index];
    if (!lyric.background) return lyric;
  }

  return undefined;
}

function contextPrompt(
  lyrics: QuizLyric[],
  promptLyric: QuizLyric,
  direction: NeighborDirection
): string | null {
  const official = officialLyrics(lyrics);
  if (isUniqueText(official, promptLyric)) {
    return `“${promptLyric.text}”`;
  }

  if (direction === 'next') {
    const previous = officialNeighbor(lyrics, promptLyric.index, -1);
    if (previous) return `“${previous.text} / ${promptLyric.text}”`;
  }

  if (direction === 'previous') {
    const next = officialNeighbor(lyrics, promptLyric.index, 1);
    if (next) return `“${promptLyric.text} / ${next.text}”`;
  }

  return null;
}

function lyricQuestionCandidates(parsed: ParsedQuizSources, target: QuizLyric) {
  const candidates: { prompt: string; target: QuizLyric }[] = [];
  const { lyrics } = parsed;
  const official = officialLyrics(lyrics);
  const firstLine = official[0];
  const lastLine = official[official.length - 1];

  if (target.background) return candidates;

  if (target.index === firstLine?.index) {
    candidates.push({
      prompt: '“宇宙冷漠”这首歌的第一句歌词是什么？',
      target,
    });
  }

  if (target.index === lastLine?.index) {
    candidates.push({
      prompt: '“宇宙冷漠”这首歌的最后一句歌词是什么？',
      target,
    });
  }

  const previousPrompt = officialNeighbor(lyrics, target.index, -1);
  if (previousPrompt) {
    const prompt = contextPrompt(lyrics, previousPrompt, 'next');
    if (prompt) {
      candidates.push({
        prompt: `${prompt}的下一句歌词是什么？`,
        target,
      });
    }
  }

  const nextPrompt = officialNeighbor(lyrics, target.index, 1);
  if (nextPrompt) {
    const prompt = contextPrompt(lyrics, nextPrompt, 'previous');
    if (prompt) {
      candidates.push({
        prompt: `${prompt}的上一句歌词是什么？`,
        target,
      });
    }
  }

  return candidates;
}

function makeLyricQuestion(parsed: ParsedQuizSources, random: Random): QuizQuestion {
  const official = officialLyrics(parsed.lyrics);
  const firstLine = official[0];
  const lastLine = official[official.length - 1];
  const edgeTargets = [firstLine, lastLine].filter((lyric): lyric is QuizLyric => Boolean(lyric));
  const targets = uniqueByText(
    [...parsed.targets.filter((lyric) => !lyric.background), ...edgeTargets],
    (lyric) => String(lyric.index)
  );
  let target = pick(targets, random);
  let candidates = lyricQuestionCandidates(parsed, target);

  let attempts = 0;
  while (candidates.length === 0 && attempts < 40) {
    attempts += 1;
    target = pick(targets, random);
    candidates = lyricQuestionCandidates(parsed, target);
  }

  const candidate = pick(candidates, random);

  return {
    prompt: candidate.prompt,
    answer: candidate.target.text,
    options: makeOptionsForLyricQuestion(parsed, candidate.target, random),
    kind: 'lyric',
  };
}

function optionTextForIndexedLine(
  parsed: ParsedQuizSources,
  lyric: QuizLyric,
  contextSide: OptionContextSide = 'previous'
) {
  if (isUniqueText(parsed.lyrics, lyric)) return lyric.text;

  const previous = parsed.lyrics[lyric.index - 1]?.text;
  const next = parsed.lyrics[lyric.index + 1]?.text;

  if (contextSide === 'next') {
    if (next) return `${lyric.text} / ${next}`;
    if (previous) return `${previous} / ${lyric.text}`;
  }

  if (previous) return `${previous} / ${lyric.text}`;
  if (next) return `${lyric.text} / ${next}`;
  return lyric.text;
}

function makeSpecialOptions(
  parsed: ParsedQuizSources,
  correct: QuizLyric,
  distractors: QuizLyric[],
  random: Random,
  contextSide: OptionContextSide = 'previous'
): QuizOption[] {
  const correctText = optionTextForIndexedLine(parsed, correct, contextSide);
  const options = [
    { id: 'correct', text: correctText, correct: true },
    ...sampleUnique(
      distractors.filter(
        (lyric) => optionTextForIndexedLine(parsed, lyric, contextSide) !== correctText
      ),
      3,
      random,
      (lyric) => optionTextForIndexedLine(parsed, lyric, contextSide)
    ).map((lyric, index) => ({
      id: optionId('special', index),
      text: optionTextForIndexedLine(parsed, lyric, contextSide),
      correct: false,
    })),
  ];

  return shuffle(options, random);
}

function makeKakaaQuestion(parsed: ParsedQuizSources, random: Random): QuizQuestion {
  const correct = pick(
    parsed.lyrics.filter((lyric) => lyric.singer === KAKAA && !lyric.background),
    random
  );
  const distractors = parsed.lyrics.filter((lyric) => lyric.singer !== KAKAA && !lyric.background);

  return {
    prompt: '以下哪一句歌词是由咔咔唱的？',
    answer: optionTextForIndexedLine(parsed, correct),
    options: makeSpecialOptions(parsed, correct, distractors, random),
    kind: 'special',
  };
}

function neighborMatches(
  lyrics: QuizLyric[],
  lyric: QuizLyric,
  direction: '上' | '下',
  marker: string
) {
  const neighborIndex = direction === '上' ? lyric.index - 1 : lyric.index + 1;
  return lyrics[neighborIndex]?.text === marker;
}

function isNearLightWu(lyrics: QuizLyric[], lyric: QuizLyric) {
  return (
    lyrics[lyric.index - 1]?.text === '芜（轻）~' || lyrics[lyric.index + 1]?.text === '芜（轻）~'
  );
}

function makeMarkerQuestion(parsed: ParsedQuizSources, random: Random): QuizQuestion {
  const marker = pick(['芜~', '嘎嘎嘎~'], random);
  const direction = pick(['上', '下'] as const, random);
  const eligible = parsed.lyrics.filter((lyric) => !lyric.background);
  const correctCandidates = eligible.filter((lyric) =>
    neighborMatches(parsed.lyrics, lyric, direction, marker)
  );
  const correct = pick(correctCandidates, random);
  const contextSide = direction === '上' ? 'next' : 'previous';
  const distractors = eligible.filter((lyric) => {
    if (neighborMatches(parsed.lyrics, lyric, direction, marker)) return false;
    if (marker === '芜~' && isNearLightWu(parsed.lyrics, lyric)) return false;
    return true;
  });

  return {
    prompt: `以下哪一句歌词的${direction}一句是“${marker}”？`,
    answer: optionTextForIndexedLine(parsed, correct, contextSide),
    options: makeSpecialOptions(parsed, correct, distractors, random, contextSide),
    kind: 'special',
  };
}

function makeSpecialQuestion(parsed: ParsedQuizSources, random: Random): QuizQuestion {
  return random() < 0.5 ? makeKakaaQuestion(parsed, random) : makeMarkerQuestion(parsed, random);
}

export function parseQuizSources(
  lyricsSource: string,
  distractorsSource: string
): ParsedQuizSources {
  const lyricLines = nonEmptyLines(lyricsSource);
  const distractorLines = nonEmptyLines(distractorsSource);

  if (lyricLines.length !== distractorLines.length) {
    throw new Error(
      `lyrics.txt and lyric-distractors.txt must align 1:1; found ${lyricLines.length} lyrics and ${distractorLines.length} distractor rows`
    );
  }

  const lyrics = lyricLines.map((sourceText, index): QuizLyric => {
    const text = stripSingerMarker(sourceText);
    return {
      index,
      text,
      sourceText,
      singer: sourceText.endsWith(KAKAA_SUFFIX) ? KAKAA : CAINONGLAILA,
      background: text.endsWith(BACKGROUND_SUFFIX),
      distractorSpec: distractorLines[index],
    };
  });

  for (const lyric of lyrics) {
    if (/^\d+$/.test(lyric.distractorSpec)) {
      const referencedIndex = Number(lyric.distractorSpec) - 1;
      if (referencedIndex < 0 || referencedIndex >= lyrics.length) {
        throw new Error(`Lyric ${lyric.index + 1} references missing distractors`);
      }
    }
  }

  return {
    lyrics,
    targets: lyrics.filter((lyric) => lyric.distractorSpec !== '-'),
  };
}

export function generateQuiz(parsed: ParsedQuizSources, random: Random = Math.random) {
  const questions: QuizQuestion[] = [];

  for (let index = 0; index < LYRIC_QUESTION_COUNT; index += 1) {
    questions.push(makeLyricQuestion(parsed, random));
  }

  questions.push(makeSpecialQuestion(parsed, random));

  if (questions.length !== QUESTION_COUNT) {
    throw new Error(`Quiz should contain ${QUESTION_COUNT} questions`);
  }

  return questions;
}
