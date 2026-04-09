import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import Ajv2020 from 'ajv/dist/2020.js';
import { parse as parseCsv } from 'csv-parse/sync';

import { buildSha256 } from './metadata.js';
import { DATASET_HEADER_MAP, CURRENT_DIR, REQUIRED_OUTPUT_FILES, SNAPSHOTS_DIR, schemaMap, schemaVersions } from './schemas.js';
import type {
  CatalogCrosswalkRecord,
  DatasetArtifacts,
  DatasetRecord,
  PixActiveParticipantRecord,
  PixInAdhesionRecord,
  SnapshotManifest,
  SpiParticipantRecord,
  ValidationIssue,
  ValidationSummary,
} from './types.js';

function createSummary(): ValidationSummary {
  return {
    ok: true,
    warnings: [],
    errors: [],
    checks: [],
  };
}

function mergeValidationSummaries(...summaries: ValidationSummary[]): ValidationSummary {
  const warnings = summaries.flatMap(summary => summary.warnings);
  const errors = summaries.flatMap(summary => summary.errors);
  const checks = summaries.flatMap(summary => summary.checks);

  return {
    ok: errors.length === 0,
    warnings,
    errors,
    checks,
  };
}

function validateUniqueKey(
  values: Array<string | null>,
  dataset: ValidationIssue['dataset'],
  field: string,
  issues: ValidationIssue[]
) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  for (const duplicate of duplicates) {
    issues.push({
      severity: 'warning',
      dataset,
      stage: 'semantic',
      message: `Duplicate ${field} detected: ${duplicate}`,
    });
  }
}

function validateDatasetSchemas(
  artifacts: Record<string, DatasetArtifacts<DatasetRecord>>
): ValidationSummary {
  const ajv = new Ajv2020({
    allErrors: true,
    allowUnionTypes: true,
    strict: false,
  });
  const summary = createSummary();

  for (const [datasetName, artifact] of Object.entries(artifacts)) {
    const dataset = datasetName as keyof typeof schemaMap;
    const schema = schemaMap[dataset];
    const validate = ajv.compile(schema);

    for (const [index, record] of artifact.records.entries()) {
      if (!validate(record)) {
        summary.errors.push({
          severity: 'error',
          dataset,
          stage: 'schema',
          message: `${dataset}[${index}] failed schema validation: ${
            validate.errors?.map(error => `${error.instancePath || '/'} ${error.message}`).join('; ')
          }`,
        });
        if (summary.errors.length > 25) break;
      }
    }

    summary.checks.push(`schema:${dataset}`);
  }

  summary.ok = summary.errors.length === 0;
  return summary;
}

function validateDatasetSemantics(
  artifacts: Record<string, DatasetArtifacts<DatasetRecord>>
): ValidationSummary {
  const summary = createSummary();
  const spiRecords = artifacts.spi_participants.records as SpiParticipantRecord[];
  const pixActiveRecords = artifacts.pix_active_participants.records as PixActiveParticipantRecord[];
  const pixAdhesionRecords = artifacts.pix_in_adhesion.records as PixInAdhesionRecord[];
  const crosswalkRecords = artifacts.catalog_crosswalk.records as CatalogCrosswalkRecord[];

  for (const [datasetName, artifact] of Object.entries(artifacts)) {
    if (artifact.rowCount === 0) {
      summary.errors.push({
        severity: 'error',
        dataset: datasetName as ValidationIssue['dataset'],
        stage: 'semantic',
        message: `Dataset ${datasetName} is unexpectedly empty.`,
      });
    }
  }

  validateUniqueKey(spiRecords.map(record => record.ispb), 'spi_participants', 'ispb', summary.warnings);
  validateUniqueKey(
    pixActiveRecords.map(record => record.source_record_id),
    'pix_active_participants',
    'source_record_id',
    summary.warnings
  );
  validateUniqueKey(
    pixAdhesionRecords.map(record => record.source_record_id),
    'pix_in_adhesion',
    'source_record_id',
    summary.warnings
  );

  for (const record of spiRecords) {
    if (!record.ispb || !record.cnpj) {
      summary.errors.push({
        severity: 'error',
        dataset: 'spi_participants',
        stage: 'semantic',
        message: `SPI record ${record.source_record_id} must contain both ISPB and CNPJ.`,
      });
    }
  }

  for (const record of pixActiveRecords) {
    if (!record.cnpj) {
      summary.errors.push({
        severity: 'error',
        dataset: 'pix_active_participants',
        stage: 'semantic',
        message: `Pix active record ${record.source_record_id} is missing a CNPJ.`,
      });
    }
  }

  for (const record of pixAdhesionRecords) {
    if (!record.adhesion_status) {
      summary.errors.push({
        severity: 'error',
        dataset: 'pix_in_adhesion',
        stage: 'semantic',
        message: `Pix adhesion record ${record.source_record_id} is missing adhesion_status.`,
      });
    }
  }

  if (
    crosswalkRecords.length !==
    spiRecords.length + pixActiveRecords.length + pixAdhesionRecords.length
  ) {
    summary.errors.push({
      severity: 'error',
      dataset: 'catalog_crosswalk',
      stage: 'semantic',
      message:
        'catalog_crosswalk must contain exactly one row per source record from the canonical datasets.',
    });
  } else {
    summary.checks.push('crosswalk:one-row-per-source-record');
  }

  for (const record of crosswalkRecords) {
    if (record.source_snapshot_date !== record.catalog_snapshot_date) {
      summary.errors.push({
        severity: 'error',
        dataset: 'catalog_crosswalk',
        stage: 'semantic',
        message: `Crosswalk row ${record.source_record_id} has mismatched source_snapshot_date and catalog_snapshot_date.`,
      });
    }
  }

  if (summary.errors.length === 0) {
    summary.checks.push('integrity:row-counts');
  }

  summary.ok = summary.errors.length === 0;
  return summary;
}

export function validateDatasetRecords(
  artifacts: Record<string, DatasetArtifacts<DatasetRecord>>
): ValidationSummary {
  return mergeValidationSummaries(
    validateDatasetSchemas(artifacts),
    validateDatasetSemantics(artifacts)
  );
}

export async function validateCatalogDirectory(currentDir: string): Promise<ValidationSummary> {
  const ajv = new Ajv2020({
    allErrors: true,
    allowUnionTypes: true,
    strict: false,
  });
  const summary = createSummary();

  for (const fileName of REQUIRED_OUTPUT_FILES) {
    try {
      await stat(path.join(currentDir, fileName));
      summary.checks.push(`exists:${fileName}`);
    } catch {
      summary.errors.push({
        severity: 'error',
        dataset: 'catalog',
        stage: 'schema',
        message: `Missing required file in ${currentDir}: ${fileName}`,
      });
    }
  }

  if (summary.errors.length > 0) {
    summary.ok = false;
    return summary;
  }

  for (const datasetName of Object.keys(schemaMap)) {
    const dataset = datasetName as keyof typeof schemaMap;
    const jsonPath = path.join(currentDir, `${dataset}.json`);
    const csvPath = path.join(currentDir, `${dataset}.csv`);

    try {
      const jsonText = await readFile(jsonPath, 'utf8');
      const csvText = await readFile(csvPath, 'utf8');
      const parsedJson = JSON.parse(jsonText) as DatasetRecord[];
      const csvRows = parseCsv(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      }) as Record<string, string>[];
      const expectedHeader = DATASET_HEADER_MAP[dataset].join(',');
      const actualHeader = csvText.split(/\r?\n/, 1)[0]?.trim() ?? '';

      if (!Array.isArray(parsedJson)) {
        summary.errors.push({
          severity: 'error',
          dataset,
          stage: 'schema',
          message: `${dataset}.json does not contain a JSON array.`,
        });
        continue;
      }

      if (actualHeader !== expectedHeader) {
        summary.errors.push({
          severity: 'error',
          dataset,
          stage: 'schema',
          message: `CSV header mismatch for ${dataset}. Expected "${expectedHeader}" but found "${actualHeader}".`,
        });
      } else {
        summary.checks.push(`headers:${dataset}`);
      }

      if (parsedJson.length !== csvRows.length) {
        summary.errors.push({
          severity: 'error',
          dataset,
          stage: 'schema',
          message: `JSON/CSV row count mismatch for ${dataset}: ${parsedJson.length} vs ${csvRows.length}`,
        });
      } else {
        summary.checks.push(`rows:${dataset}`);
      }

      const validate = ajv.compile(schemaMap[dataset]);
      for (const [index, record] of parsedJson.entries()) {
        if (!validate(record)) {
          summary.errors.push({
            severity: 'error',
            dataset,
            stage: 'schema',
            message: `${dataset}[${index}] failed schema validation in ${path.basename(
              jsonPath
            )}: ${validate.errors
              ?.map(error => `${error.instancePath || '/'} ${error.message}`)
              .join('; ')}`,
          });
          if (summary.errors.length > 50) break;
        }
      }

      summary.checks.push(`schema:${dataset}`);
    } catch (error) {
      summary.errors.push({
        severity: 'error',
        dataset,
        stage: 'schema',
        message: `Could not validate ${dataset}: ${(error as Error).message}`,
      });
    }
  }

  summary.ok = summary.errors.length === 0;
  return summary;
}

export async function validateRepositoryState(repoRoot: string): Promise<ValidationSummary> {
  const currentValidation = await validateCatalogDirectory(path.join(repoRoot, CURRENT_DIR));
  if (!currentValidation.ok) return currentValidation;

  const manifest = JSON.parse(
    await readFile(path.join(repoRoot, CURRENT_DIR, 'manifest.json'), 'utf8')
  ) as SnapshotManifest;

  try {
    const datapackage = JSON.parse(
      await readFile(path.join(repoRoot, 'datapackage.json'), 'utf8')
    ) as {
      resources?: Array<{ path?: string; hash?: string; rows?: number }>;
    };
    const resourceMap = new Map(
      (datapackage.resources ?? [])
        .filter(resource => resource.path)
        .map(resource => [resource.path!, resource])
    );

    for (const datasetName of Object.keys(schemaMap)) {
      const dataset = datasetName as keyof typeof schemaMap;
      const csvResourcePath = path.posix.join(CURRENT_DIR, `${dataset}.csv`);
      const jsonResourcePath = path.posix.join(CURRENT_DIR, `${dataset}.json`);
      const csvResource = resourceMap.get(csvResourcePath);
      const jsonResource = resourceMap.get(jsonResourcePath);

      if (!csvResource) {
        currentValidation.errors.push({
          severity: 'error',
          dataset: 'catalog',
          stage: 'promotion',
          message: `datapackage.json is missing current/${dataset}.csv`,
        });
      }
      if (!jsonResource) {
        currentValidation.errors.push({
          severity: 'error',
          dataset: 'catalog',
          stage: 'promotion',
          message: `datapackage.json is missing current/${dataset}.json`,
        });
      }

      const csvText = await readFile(path.join(repoRoot, CURRENT_DIR, `${dataset}.csv`), 'utf8');
      const jsonText = await readFile(path.join(repoRoot, CURRENT_DIR, `${dataset}.json`), 'utf8');
      const jsonRows = JSON.parse(jsonText) as unknown[];
      const expectedCount = manifest.record_counts[dataset];
      const expectedHashes = manifest.dataset_hashes[dataset];

      if (jsonRows.length !== expectedCount) {
        currentValidation.errors.push({
          severity: 'error',
          dataset,
          stage: 'promotion',
          message: `manifest.json row count for ${dataset} is ${expectedCount}, but current/${dataset}.json contains ${jsonRows.length} rows.`,
        });
      } else {
        currentValidation.checks.push(`manifest:rows:${dataset}`);
      }

      if (buildSha256(csvText) !== expectedHashes.csv_sha256) {
        currentValidation.errors.push({
          severity: 'error',
          dataset,
          stage: 'promotion',
          message: `manifest.json csv hash mismatch for ${dataset}.`,
        });
      } else {
        currentValidation.checks.push(`manifest:csv-hash:${dataset}`);
      }

      if (buildSha256(jsonText) !== expectedHashes.json_sha256) {
        currentValidation.errors.push({
          severity: 'error',
          dataset,
          stage: 'promotion',
          message: `manifest.json json hash mismatch for ${dataset}.`,
        });
      } else {
        currentValidation.checks.push(`manifest:json-hash:${dataset}`);
      }

      if (manifest.schema_versions[dataset] !== schemaVersions[dataset]) {
        currentValidation.errors.push({
          severity: 'error',
          dataset,
          stage: 'promotion',
          message: `manifest.json schema version for ${dataset} is ${manifest.schema_versions[dataset]}, expected ${schemaVersions[dataset]}.`,
        });
      } else {
        currentValidation.checks.push(`manifest:schema-version:${dataset}`);
      }

      if (csvResource?.hash && csvResource.hash !== buildSha256(csvText)) {
        currentValidation.errors.push({
          severity: 'error',
          dataset,
          stage: 'promotion',
          message: `datapackage.json hash mismatch for current/${dataset}.csv.`,
        });
      }

      if (jsonResource?.hash && jsonResource.hash !== buildSha256(jsonText)) {
        currentValidation.errors.push({
          severity: 'error',
          dataset,
          stage: 'promotion',
          message: `datapackage.json hash mismatch for current/${dataset}.json.`,
        });
      }

      if (csvResource?.rows != null && csvResource.rows !== expectedCount) {
        currentValidation.errors.push({
          severity: 'error',
          dataset,
          stage: 'promotion',
          message: `datapackage.json row count mismatch for current/${dataset}.csv.`,
        });
      }

      if (jsonResource?.rows != null && jsonResource.rows !== expectedCount) {
        currentValidation.errors.push({
          severity: 'error',
          dataset,
          stage: 'promotion',
          message: `datapackage.json row count mismatch for current/${dataset}.json.`,
        });
      }
    }

    currentValidation.checks.push('datapackage:resources');
  } catch (error) {
    currentValidation.errors.push({
      severity: 'error',
      dataset: 'catalog',
      stage: 'promotion',
      message: `Could not validate datapackage.json: ${(error as Error).message}`,
    });
  }

  try {
    const snapshotManifestPath = path.join(
      repoRoot,
      SNAPSHOTS_DIR,
      manifest.snapshot_date,
      'manifest.json'
    );
    await stat(snapshotManifestPath);
    currentValidation.checks.push('snapshots:current-manifest-present');
  } catch {
    currentValidation.errors.push({
      severity: 'error',
      dataset: 'catalog',
      stage: 'promotion',
      message: `snapshots/${manifest.snapshot_date}/manifest.json is missing for the promoted current snapshot.`,
    });
  }

  currentValidation.ok = currentValidation.errors.length === 0;
  return currentValidation;
}

