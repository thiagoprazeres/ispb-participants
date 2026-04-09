import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PipelineStageError, type ValidationSummary } from '../src/catalog/types.js';
import { buildDatasetsStage } from './build-datasets.js';
import { fetchSourcesStage } from './fetch-sources.js';
import { generateArtifactsStage } from './generate-artifacts.js';
import { promoteCurrentStage } from './promote-current.js';
import { validateCatalogStage } from './validate-catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function throwIfValidationFailed(validation: ValidationSummary) {
  if (validation.ok) return;
  const firstError = validation.errors[0];
  throw new PipelineStageError(
    firstError?.stage ?? 'semantic',
    validation.errors.map(error => `[${error.dataset}] ${error.message}`).join(' | '),
    firstError?.dataset
  );
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const snapshotDate = process.env.CATALOG_SNAPSHOT_DATE;

  const fetched = await fetchSourcesStage(repoRoot);
  const built = await buildDatasetsStage(fetched, snapshotDate);

  if (built.validation.warnings.length > 0) {
    console.log(`Warnings: ${built.validation.warnings.length}`);
    for (const warning of built.validation.warnings) {
      console.log(`- [${warning.stage ?? 'semantic'}][${warning.dataset}] ${warning.message}`);
    }
  }

  throwIfValidationFailed(built.validation);
  await promoteCurrentStage(repoRoot, built);
  await generateArtifactsStage(repoRoot);

  const repositoryValidation = await validateCatalogStage(repoRoot);
  throwIfValidationFailed(repositoryValidation);

  console.log(`Snapshot promoted: ${built.snapshotDate}`);
  console.log(
    `Rows: spi=${built.manifest.record_counts.spi_participants}, pix_active=${built.manifest.record_counts.pix_active_participants}, pix_adhesion=${built.manifest.record_counts.pix_in_adhesion}, crosswalk=${built.manifest.record_counts.catalog_crosswalk}`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch(error => {
    const message =
      error instanceof PipelineStageError
        ? `[${error.stage}] ${error.message}`
        : error instanceof Error
          ? `[promotion] ${error.message}`
          : `[promotion] ${String(error)}`;
    console.error(message);
    process.exit(1);
  });
}

