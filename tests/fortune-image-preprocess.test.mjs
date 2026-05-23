import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';

import {
  parseOptions,
  preprocessConfiguredImageFolders,
  preprocessFortuneImages,
} from '../scripts/preprocess-fortune-images.mjs';

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

test('default image pipeline processes named PNGs from category folders', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'named-image-folders-'));
  const fortuneSourceDir = path.join(root, 'assets', 'source', 'fortunes');
  const playSourceDir = path.join(root, 'assets', 'source', 'play-options');

  try {
    await mkdir(fortuneSourceDir, { recursive: true });
    await mkdir(playSourceDir, { recursive: true });

    await sharp({
      create: {
        width: 24,
        height: 24,
        channels: 4,
        background: { r: 255, g: 80, b: 80, alpha: 0.85 },
      },
    })
      .png()
      .toFile(path.join(fortuneSourceDir, '吉.png'));

    await sharp({
      create: {
        width: 20,
        height: 28,
        channels: 4,
        background: { r: 80, g: 220, b: 180, alpha: 0.85 },
      },
    })
      .png()
      .toFile(path.join(playSourceDir, '战士.png'));

    const options = parseOptions(['--max', '16'], root);
    const outputs = await preprocessConfiguredImageFolders(options);

    assert.deepEqual(
      outputs.map((output) => path.relative(root, output.outputPath).replaceAll(path.sep, '/')),
      ['public/fortunes/吉.webp', 'public/play-options/战士.webp']
    );
    assert.deepEqual(await readdir(path.join(root, 'public', 'fortunes')), ['吉.webp']);
    assert.deepEqual(await readdir(path.join(root, 'public', 'play-options')), ['战士.webp']);
  } finally {
    sharp.cache(false);
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

test('can select only the play option image folder from the CLI options', () => {
  const root = path.resolve('example-root');
  const options = parseOptions(['--group', 'play-options'], root);

  assert.deepEqual(
    options.folders.map((folder) => ({
      id: folder.id,
      sourceDir: path.relative(root, folder.sourceDir).replaceAll(path.sep, '/'),
      outputDir: path.relative(root, folder.outputDir).replaceAll(path.sep, '/'),
    })),
    [
      {
        id: 'play-options',
        sourceDir: 'assets/source/play-options',
        outputDir: 'public/play-options',
      },
    ]
  );
});
