import { parse } from 'smol-toml';

export type RollResultEntry = {
  name: string;
  color: string;
  weight?: number;
  comment: string;
  artist?: string;
  artist_link?: string;
};

type ParseRollResultTomlOptions = {
  rootKey: string;
  sourceName: string;
  entryLabel: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRollResultEntry(value: unknown, index: number, entryLabel: string): RollResultEntry {
  if (!isRecord(value)) {
    throw new Error(`${entryLabel} ${index + 1} must be a table`);
  }

  if (typeof value.name !== 'string') {
    throw new Error(`${entryLabel} ${index + 1} must define a string name`);
  }

  if (typeof value.color !== 'string') {
    throw new Error(`${entryLabel} ${index + 1} must define a string color`);
  }

  if (typeof value.comment !== 'string') {
    throw new Error(`${entryLabel} ${index + 1} must define a string comment`);
  }

  if (value.artist !== undefined && typeof value.artist !== 'string') {
    throw new Error(`${entryLabel} ${index + 1} artist must be a string`);
  }

  if (value.artist_link !== undefined && typeof value.artist_link !== 'string') {
    throw new Error(`${entryLabel} ${index + 1} artist_link must be a string`);
  }

  if (value.weight !== undefined) {
    if (typeof value.weight !== 'number' || value.weight <= 0) {
      throw new Error(`${entryLabel} ${index + 1} weight must be a positive number`);
    }

    return {
      name: value.name,
      color: value.color,
      comment: value.comment,
      artist: value.artist,
      artist_link: value.artist_link,
      weight: value.weight,
    };
  }

  return {
    name: value.name,
    color: value.color,
    comment: value.comment,
    artist: value.artist,
    artist_link: value.artist_link,
  };
}

export function parseRollResultToml(
  source: string,
  { rootKey, sourceName, entryLabel }: ParseRollResultTomlOptions
): RollResultEntry[] {
  const data = parse(source);

  if (!isRecord(data) || !Array.isArray(data[rootKey])) {
    throw new Error(`${sourceName} must contain [[${rootKey}]] entries`);
  }

  return data[rootKey].map((entry, index) => parseRollResultEntry(entry, index, entryLabel));
}
