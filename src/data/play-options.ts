import optionsSource from './play-options.toml?raw';
import { parseRollResultToml, type RollResultEntry } from './roll-result-entry';

export type PlayOption = RollResultEntry;

export function parsePlayOptionsToml(source: string): PlayOption[] {
  return parseRollResultToml(source, {
    rootKey: 'options',
    sourceName: 'play-options.toml',
    entryLabel: 'Play option',
  });
}

export const playOptions = parsePlayOptionsToml(optionsSource);
