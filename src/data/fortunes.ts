import { parse } from 'smol-toml';
import fortunesSource from './fortunes.toml?raw';

export type Fortune = {
  name: string;
  color: string;
  weight?: number;
  comment?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseFortune(value: unknown, index: number): Fortune {
  if (!isRecord(value)) {
    throw new Error(`Fortune ${index + 1} must be a table`);
  }

  if (typeof value.name !== 'string') {
    throw new Error(`Fortune ${index + 1} must define a string name`);
  }

  if (typeof value.color !== 'string') {
    throw new Error(`Fortune ${index + 1} must define a string color`);
  }

  if (value.comment !== undefined && typeof value.comment !== 'string') {
    throw new Error(`Fortune ${index + 1} comment must be a string`);
  }

  if (value.weight !== undefined) {
    if (typeof value.weight !== 'number' || value.weight <= 0) {
      throw new Error(`Fortune ${index + 1} weight must be a positive number`);
    }

    return {
      name: value.name,
      color: value.color,
      comment: value.comment,
      weight: value.weight,
    };
  }

  return {
    name: value.name,
    color: value.color,
    comment: value.comment,
  };
}

export function parseFortunesToml(source: string): Fortune[] {
  const data = parse(source);

  if (!isRecord(data) || !Array.isArray(data.fortunes)) {
    throw new Error('fortunes.toml must contain [[fortunes]] entries');
  }

  return data.fortunes.map(parseFortune);
}

export const fortunes = parseFortunesToml(fortunesSource);
