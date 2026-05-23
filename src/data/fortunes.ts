import fortunesSource from './fortunes.toml?raw';
import { parseRollResultToml, type RollResultEntry } from './roll-result-entry';

export type Fortune = RollResultEntry;

export function parseFortunesToml(source: string): Fortune[] {
  return parseRollResultToml(source, {
    rootKey: 'fortunes',
    sourceName: 'fortunes.toml',
    entryLabel: 'Fortune',
  });
}

export const fortunes = parseFortunesToml(fortunesSource);
