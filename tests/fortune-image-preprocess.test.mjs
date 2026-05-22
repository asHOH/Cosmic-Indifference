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

test('generates derived fortune images from 凶 transforms', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fortune-images-derived-'));
  const sourceDir = path.join(root, 'source');
  const outputDir = path.join(root, 'public');

  try {
    await mkdir(sourceDir, { recursive: true });

    await sharp({
      create: {
        width: 100,
        height: 80,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: Buffer.from(
            '<svg width="100" height="80"><rect x="0" y="0" width="100" height="80" fill="red"/></svg>'
          ),
        },
      ])
      .png()
      .toFile(path.join(sourceDir, '凶.png'));

    const outputs = await preprocessFortuneImages({
      sourceDir,
      outputDir,
      maxDimension: 100,
      quality: 90,
      alphaQuality: 100,
    });

    assert.deepEqual(
      outputs.map((output) => output.fileName),
      ['凶.webp', '小凶.webp', '冈.webp', '区.webp']
    );

    const baseMetadata = await sharp(path.join(outputDir, '凶.webp')).metadata();
    const scaledPath = path.join(outputDir, '小凶.webp');
    const scaledMetadata = await sharp(scaledPath).metadata();
    const rotated90Metadata = await sharp(path.join(outputDir, '区.webp')).metadata();
    const rotated180Metadata = await sharp(path.join(outputDir, '冈.webp')).metadata();

    assert.equal(baseMetadata.width, 100);
    assert.equal(baseMetadata.height, 80);
    assert.equal(scaledMetadata.width, 100);
    assert.equal(scaledMetadata.height, 80);
    assert.equal(rotated90Metadata.width, 80);
    assert.equal(rotated90Metadata.height, 100);
    assert.equal(rotated180Metadata.width, 100);
    assert.equal(rotated180Metadata.height, 80);

    const { data, info } = await sharp(scaledPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let minX = info.width;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        const alpha = data[(y * info.width + x) * info.channels + 3];
        if (alpha > 16) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    assert.ok(maxX >= minX);
    assert.ok(maxY >= minY);
    assert.ok(maxX - minX + 1 <= 35);
    assert.ok(maxY - minY + 1 <= 29);
  } finally {
    sharp.cache(false);
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
