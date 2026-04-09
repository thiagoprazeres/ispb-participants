import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCrosswalk } from '../src/catalog/crosswalk.js';
import { buildDatasetArtifacts, buildManifest } from '../src/catalog/metadata.js';
import {
  normalizePixActiveRecords,
  normalizePixInAdhesionRecords,
  normalizeSpiRecords,
  parsePixCombinedCsv,
  parseSemicolonCsvRows,
} from '../src/catalog/normalize.js';
import { validateDatasetRecords } from '../src/catalog/validate.js';
import type { CatalogBuildResult, FetchedCatalogSources } from '../src/catalog/types.js';
import { PipelineStageError } from '../src/catalog/types.js';
import { fetchSourcesStage } from './fetch-sources.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildDatasetsStage(
  fetched: FetchedCatalogSources,
  snapshotDate?: string
): Promise<CatalogBuildResult> {
  const effectiveSnapshotDate = snapshotDate ?? fetched.collectedAt.slice(0, 10);

  let spiRecords;
  let pixActiveRecords;
  let pixInAdhesionRecords;

  try {
    const spiRows = parseSemicolonCsvRows(fetched.raw.spiCsvText);
    const pixSections = parsePixCombinedCsv(fetched.raw.pixCsvText);

    spiRecords = normalizeSpiRecords(
      spiRows,
      effectiveSnapshotDate,
      fetched.sources.spi_participants
    );
    pixActiveRecords = normalizePixActiveRecords(
      pixSections.active,
      effectiveSnapshotDate,
      fetched.sources.pix_active_participants
    );
    pixInAdhesionRecords = normalizePixInAdhesionRecords(
      pixSections.adhesion,
      effectiveSnapshotDate,
      fetched.sources.pix_in_adhesion
    );
  } catch (error) {
    throw new PipelineStageError(
      'parse',
      error instanceof Error ? error.message : String(error),
      'catalog'
    );
  }

  const crosswalk = buildCrosswalk(effectiveSnapshotDate, {
    spi: spiRecords,
    pixActive: pixActiveRecords,
    pixInAdhesion: pixInAdhesionRecords,
  });

  const artifacts = {
    spi_participants: buildDatasetArtifacts('spi_participants', spiRecords),
    pix_active_participants: buildDatasetArtifacts(
      'pix_active_participants',
      pixActiveRecords
    ),
    pix_in_adhesion: buildDatasetArtifacts('pix_in_adhesion', pixInAdhesionRecords),
    catalog_crosswalk: buildDatasetArtifacts('catalog_crosswalk', crosswalk.records),
  };

  const validation = validateDatasetRecords(artifacts);
  validation.warnings.push(...crosswalk.warnings);
  validation.ok = validation.errors.length === 0;

  const manifest = buildManifest(
    effectiveSnapshotDate,
    fetched.collectedAt,
    fetched.sources,
    artifacts,
    validation
  );

  return {
    snapshotDate: effectiveSnapshotDate,
    collectedAt: fetched.collectedAt,
    sources: fetched.sources,
    datasets: {
      spi_participants: spiRecords,
      pix_active_participants: pixActiveRecords,
      pix_in_adhesion: pixInAdhesionRecords,
      catalog_crosswalk: crosswalk.records,
    },
    artifacts,
    validation,
    manifest,
  };
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const fetched = await fetchSourcesStage(repoRoot);
  const result = await buildDatasetsStage(fetched, process.env.CATALOG_SNAPSHOT_DATE);

  console.log(`Snapshot: ${result.snapshotDate}`);
  console.log(
    `Rows: spi=${result.manifest.record_counts.spi_participants}, pix_active=${result.manifest.record_counts.pix_active_participants}, pix_adhesion=${result.manifest.record_counts.pix_in_adhesion}, crosswalk=${result.manifest.record_counts.catalog_crosswalk}`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch(error => {
    const message =
      error instanceof PipelineStageError
        ? `[${error.stage}] ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error);
    console.error(message);
    process.exit(1);
  });
}
