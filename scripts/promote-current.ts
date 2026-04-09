import { mkdtemp, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CURRENT_DIR, SNAPSHOTS_DIR } from '../src/catalog/schemas.js';
import { validateCatalogDirectory } from '../src/catalog/validate.js';
import type { CatalogBuildResult, DatasetName } from '../src/catalog/types.js';
import { PipelineStageError } from '../src/catalog/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureCleanDirectory(targetDir: string) {
  await rm(targetDir, { force: true, recursive: true });
  await mkdir(targetDir, { recursive: true });
}

async function writeArtifactsIntoDirectory(
  baseDir: string,
  result: CatalogBuildResult
) {
  await ensureCleanDirectory(baseDir);

  for (const datasetName of Object.keys(result.artifacts)) {
    const dataset = datasetName as DatasetName;
    const artifact = result.artifacts[dataset];
    await writeFile(path.join(baseDir, `${dataset}.csv`), artifact.csv, 'utf8');
    await writeFile(path.join(baseDir, `${dataset}.json`), artifact.json, 'utf8');
  }

  await writeFile(
    path.join(baseDir, 'manifest.json'),
    `${JSON.stringify(result.manifest, null, 2)}\n`,
    'utf8'
  );
}

export async function promoteCurrentStage(repoRoot: string, result: CatalogBuildResult) {
  if (!result.validation.ok) {
    const firstError = result.validation.errors[0];
    throw new PipelineStageError(
      firstError?.stage ?? 'semantic',
      result.validation.errors.map(error => `[${error.dataset}] ${error.message}`).join(' | '),
      firstError?.dataset
    );
  }

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'ispb-catalog-'));
  const tempCurrentDir = path.join(tempRoot, CURRENT_DIR);
  const tempSnapshotDir = path.join(tempRoot, SNAPSHOTS_DIR, result.snapshotDate);
  await mkdir(path.join(tempRoot, SNAPSHOTS_DIR), { recursive: true });

  try {
    await writeArtifactsIntoDirectory(tempCurrentDir, result);
    await writeArtifactsIntoDirectory(tempSnapshotDir, result);

    const fsValidation = await validateCatalogDirectory(tempCurrentDir);
    if (!fsValidation.ok) {
      const firstError = fsValidation.errors[0];
      throw new PipelineStageError(
        firstError?.stage ?? 'schema',
        fsValidation.errors.map(error => `[${error.dataset}] ${error.message}`).join(' | '),
        firstError?.dataset
      );
    }

    const repoCurrentDir = path.join(repoRoot, CURRENT_DIR);
    const repoSnapshotDir = path.join(repoRoot, SNAPSHOTS_DIR, result.snapshotDate);
    const backupCurrentDir = path.join(tempRoot, 'current-previous');

    await rm(repoSnapshotDir, { force: true, recursive: true });
    await mkdir(path.join(repoRoot, SNAPSHOTS_DIR), { recursive: true });
    await rename(tempSnapshotDir, repoSnapshotDir);

    try {
      await rename(repoCurrentDir, backupCurrentDir);
    } catch {
      // current/ may not exist yet.
    }

    try {
      await rename(tempCurrentDir, repoCurrentDir);
    } catch (error) {
      try {
        await rename(backupCurrentDir, repoCurrentDir);
      } catch {
        // Best effort restore.
      }
      throw error;
    }

    await rm(backupCurrentDir, { force: true, recursive: true });
  } catch (error) {
    if (error instanceof PipelineStageError) throw error;
    throw new PipelineStageError(
      'promotion',
      error instanceof Error ? error.message : String(error),
      'catalog'
    );
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  throw new Error(
    `Use "npm run update-catalog" to execute the full promotion flow for ${repoRoot}.`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

