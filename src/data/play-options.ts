import { parse } from 'smol-toml';
import optionsSource from './play-options.toml?raw';
import type { RollResultEntry } from './roll-result-entry';

export type PlayOption = RollResultEntry;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parsePlayOption(value: unknown, index: number): PlayOption {
  if (!isRecord(value)) {
    throw new Error(`Play option ${index + 1} must be a table`);
  }

  if (typeof value.name !== 'string') {
    throw new Error(`Play option ${index + 1} must define a string name`);
  }

  if (typeof value.color !== 'string') {
    throw new Error(`Play option ${index + 1} must define a string color`);
  }

  if (typeof value.comment !== 'string') {
    throw new Error(`Play option ${index + 1} must define a string comment`);
  }

  if (value.artist !== undefined && typeof value.artist !== 'string') {
    throw new Error(`Play option ${index + 1} artist must be a string`);
  }

  if (value.artist_link !== undefined && typeof value.artist_link !== 'string') {
    throw new Error(`Play option ${index + 1} artist_link must be a string`);
  }

  if (value.weight !== undefined) {
    if (typeof value.weight !== 'number' || value.weight <= 0) {
      throw new Error(`Play option ${index + 1} weight must be a positive number`);
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

export function parsePlayOptionsToml(source: string): PlayOption[] {
  const data = parse(source);

  if (!isRecord(data) || !Array.isArray(data.options)) {
    throw new Error('play-options.toml must contain [[options]] entries');
  }

  return data.options.map(parsePlayOption);
}

export const playOptions = parsePlayOptionsToml(optionsSource);
