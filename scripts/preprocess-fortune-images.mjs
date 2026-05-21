import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DEFAULT_MAX_DIMENSION = 640;
const DEFAULT_QUALITY = 76;
const DEFAULT_ALPHA_QUALITY = 82;
const DEFAULT_SOURCE_DIR = 'assets/source';
const DEFAULT_OUTPUT_DIR = 'public/fortunes';

function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function readArgValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;

  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }

  return value;
}

export function parseOptions(args = process.argv.slice(2), cwd = process.cwd()) {
  const sourceDir = readArgValue(args, '--source') ?? DEFAULT_SOURCE_DIR;
  const outputDir = readArgValue(args, '--out') ?? DEFAULT_OUTPUT_DIR;
  const maxDimension = readArgValue(args, '--max');
  const quality = readArgValue(args, '--quality');
  const alphaQuality = readArgValue(args, '--alpha-quality');

  return {
    sourceDir: path.resolve(cwd, sourceDir),
    outputDir: path.resolve(cwd, outputDir),
    maxDimension: maxDimension
      ? parsePositiveInteger(maxDimension, '--max')
      : DEFAULT_MAX_DIMENSION,
    quality: quality ? parsePositiveInteger(quality, '--quality') : DEFAULT_QUALITY,
    alphaQuality: alphaQuality
      ? parsePositiveInteger(alphaQuality, '--alpha-quality')
      : DEFAULT_ALPHA_QUALITY,
  };
}

export async function preprocessFortuneImages({
  sourceDir,
  outputDir,
  maxDimension = DEFAULT_MAX_DIMENSION,
  quality = DEFAULT_QUALITY,
  alphaQuality = DEFAULT_ALPHA_QUALITY,
} = {}) {
  if (!sourceDir) throw new Error('sourceDir is required');
  if (!outputDir) throw new Error('outputDir is required');

  await mkdir(outputDir, { recursive: true });

  const sourceFiles = (await readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.png')
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  const outputs = [];

  for (const sourceFile of sourceFiles) {
    const sourcePath = path.join(sourceDir, sourceFile);
    const fileName = `${path.basename(sourceFile, path.extname(sourceFile))}.webp`;
    const outputPath = path.join(outputDir, fileName);
    const inputStat = await stat(sourcePath);

    const info = await sharp(sourcePath)
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality,
        alphaQuality,
        effort: 6,
      })
      .toFile(outputPath);
    const outputStat = await stat(outputPath);

    outputs.push({
      sourcePath,
      outputPath,
      fileName,
      inputBytes: inputStat.size,
      outputBytes: outputStat.size,
      width: info.width,
      height: info.height,
    });
  }

  return outputs;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const options = parseOptions();
  const outputs = await preprocessFortuneImages(options);

  if (outputs.length === 0) {
    console.log(`No PNG files found in ${options.sourceDir}`);
    return;
  }

  let totalInputBytes = 0;
  let totalOutputBytes = 0;

  for (const output of outputs) {
    totalInputBytes += output.inputBytes;
    totalOutputBytes += output.outputBytes;
    console.log(
      `${output.fileName} ${output.width}x${output.height}: ${formatBytes(
        output.inputBytes
      )} -> ${formatBytes(output.outputBytes)}`
    );
  }

  console.log(
    `Processed ${outputs.length} images: ${formatBytes(totalInputBytes)} -> ${formatBytes(
      totalOutputBytes
    )}`
  );
}

const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
