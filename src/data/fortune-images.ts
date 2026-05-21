export function fortuneImagePath(name: string) {
  return `/fortunes/${encodeURIComponent(name)}.webp`;
}
