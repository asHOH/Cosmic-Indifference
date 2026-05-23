function encodedWebpPath(folder: string, name: string) {
  return `/${folder}/${encodeURIComponent(name)}.webp`;
}

export function fortuneImagePath(name: string) {
  return encodedWebpPath('fortunes', name);
}

export function playOptionImagePath(name: string) {
  return encodedWebpPath('play-options', name);
}
