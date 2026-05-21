import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';

import { preprocessFortuneImages } from '../scripts/preprocess-fortune-images.mjs';

test('preprocesses transparent PNG fortune images to bounded lossy WebP files', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fortune-images-'));
  const sourceDir = path.join(root, 'source');
  const outputDir = path.join(root, 'public');

  try {
    await mkdir(sourceDir, { recursive: true });

    await sharp({
      create: {
        width: 32,
        height: 20,
        channels: 4,
        background: { r: 80, g: 120, b: 200, alpha: 0.45 },
      },
    })
      .png()
      .toFile(path.join(sourceDir, '开心小花.png'));
    await writeFile(path.join(sourceDir, 'ignore.txt'), 'not an image');

    const outputs = await preprocessFortuneImages({
      sourceDir,
      outputDir,
      maxDimension: 16,
      quality: 72,
    });

    assert.deepEqual(
      outputs.map((output) => output.fileName),
      ['开心小花.webp']
    );

    const outputPath = path.join(outputDir, '开心小花.webp');
    const metadata = await sharp(outputPath).metadata();
    const outputStat = await stat(outputPath);

    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.width, 16);
    assert.equal(metadata.height, 10);
    assert.equal(metadata.hasAlpha, true);
    assert.ok(outputStat.size > 0);
  } finally {
    sharp.cache(false);
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
