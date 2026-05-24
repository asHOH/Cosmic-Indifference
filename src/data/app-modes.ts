export const appModes = ['fortune', 'play', 'quiz'] as const;

export type AppMode = (typeof appModes)[number];

export const nextModeLabels: Record<AppMode, string> = {
  fortune: '切换到今天玩什么',
  play: '切换到测验',
  quiz: '切换到今日运势',
};

export function nextAppMode(mode: AppMode): AppMode {
  const index = appModes.indexOf(mode);
  return appModes[(index + 1) % appModes.length];
}
