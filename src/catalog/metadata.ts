import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  CATALOG_DESCRIPTOR_NAME,
  CURRENT_DIR,
  DATASET_HEADER_MAP,
  DOCS_DIR,
  GENERATED_DIR,
  PIPELINE_VERSION,
  PRODUCT_NAME,
  PRODUCT_SUBTITLE,
  REPOSITORY_URL,
  SCHEMAS_DIR,
  SITE_DIR,
  SNAPSHOTS_DIR,
  schemaMap,
  schemaVersions,
} from './schemas.js';
import type {
  CanonicalDatasets,
  DatasetArtifacts,
  DatasetName,
  DatasetRecord,
  Institution,
  InstitutionEntry,
  MatchConfidence,
  PackageProjection,
  ResolvedSource,
  SnapshotManifest,
  SourceDatasetName,
  ValidationSummary,
} from './types.js';

export function buildSha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

export function escapeCsvValue(value: unknown): string {
  if (value == null) return '';
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function serializeCsv<T extends Record<string, unknown>>(
  headers: readonly string[],
  records: T[]
): string {
  const lines = [headers.join(',')];
  for (const record of records) {
    lines.push(headers.map(header => escapeCsvValue(record[header])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function buildDatasetArtifacts<T extends DatasetRecord>(
  name: DatasetName,
  records: T[]
): DatasetArtifacts<T> {
  const json = JSON.stringify(records, null, 2);
  const csv = serializeCsv(DATASET_HEADER_MAP[name], records as Record<string, unknown>[]);

  return {
    name,
    records,
    json,
    csv,
    rowCount: records.length,
    schemaVersion: schemaVersions[name],
  };
}

function datasetResourcePaths(dataset: DatasetName) {
  return {
    csv: path.posix.join(CURRENT_DIR, `${dataset}.csv`),
    json: path.posix.join(CURRENT_DIR, `${dataset}.json`),
    schema: path.posix.join(SCHEMAS_DIR, `${dataset}.schema.json`),
  };
}

export function buildManifest(
  snapshotDate: string,
  collectedAt: string,
  sources: Record<SourceDatasetName, ResolvedSource>,
  artifacts: Record<DatasetName, DatasetArtifacts<DatasetRecord>>,
  validation: ValidationSummary
): SnapshotManifest {
  const datasetHashes: Record<string, Record<string, string>> = {};
  const recordCounts: Record<string, number> = {};
  const schemaVersionsMap: Record<string, string> = {};
  const sourceUrls: Record<string, string[]> = {};
  const sourcePublicationDates: Record<string, string | null> = {};

  for (const datasetName of Object.keys(artifacts)) {
    const dataset = datasetName as DatasetName;
    const artifact = artifacts[dataset];
    datasetHashes[dataset] = {
      csv_sha256: buildSha256(artifact.csv),
      json_sha256: buildSha256(artifact.json),
    };
    recordCounts[dataset] = artifact.rowCount;
    schemaVersionsMap[dataset] = artifact.schemaVersion;
  }

  for (const [dataset, source] of Object.entries(sources) as Array<
    [SourceDatasetName, ResolvedSource]
  >) {
    sourceUrls[dataset] = [
      source.officialPageUrl,
      source.officialPageApiUrl,
      source.pdfUrl,
      source.csvUrl,
    ];
    sourcePublicationDates[dataset] = source.sourcePublicationDate;
  }

  sourceUrls.catalog_crosswalk = Object.values(sourceUrls).flat();
  sourcePublicationDates.catalog_crosswalk = null;

  return {
    snapshot_date: snapshotDate,
    collected_at: collectedAt,
    source_urls: sourceUrls,
    source_publication_dates: sourcePublicationDates,
    dataset_hashes: datasetHashes,
    record_counts: recordCounts,
    schema_versions: schemaVersionsMap,
    pipeline_version: PIPELINE_VERSION,
    validation_status: {
      status: validation.ok ? 'passed' : 'failed',
      checks: validation.checks,
    },
    warnings: validation.warnings,
    errors: validation.errors,
  };
}

export async function writeSchemaFiles(repoRoot: string) {
  await mkdir(path.join(repoRoot, SCHEMAS_DIR), { recursive: true });
  await Promise.all(
    Object.entries(schemaMap).map(([dataset, schema]) =>
      writeFile(
        path.join(repoRoot, SCHEMAS_DIR, `${dataset}.schema.json`),
        `${JSON.stringify(schema, null, 2)}\n`,
        'utf8'
      )
    )
  );
}

export async function buildDataPackage(
  repoRoot: string,
  manifest: SnapshotManifest
): Promise<string> {
  const resources = [];

  for (const datasetName of Object.keys(schemaMap)) {
    const dataset = datasetName as DatasetName;
    const resourcePaths = datasetResourcePaths(dataset);
    const csvPath = path.join(repoRoot, resourcePaths.csv);
    const jsonPath = path.join(repoRoot, resourcePaths.json);
    const [csvStats, jsonStats, csvContent, jsonContent] = await Promise.all([
      stat(csvPath),
      stat(jsonPath),
      readFile(csvPath),
      readFile(jsonPath),
    ]);

    resources.push({
      name: `${dataset}_csv`,
      path: resourcePaths.csv,
      format: 'csv',
      mediatype: 'text/csv',
      schema: resourcePaths.schema,
      hash: buildSha256(csvContent),
      bytes: csvStats.size,
      rows: manifest.record_counts[dataset],
    });

    resources.push({
      name: `${dataset}_json`,
      path: resourcePaths.json,
      format: 'json',
      mediatype: 'application/json',
      schema: resourcePaths.schema,
      hash: buildSha256(jsonContent),
      bytes: jsonStats.size,
      rows: manifest.record_counts[dataset],
    });
  }

  const manifestPath = path.join(repoRoot, CURRENT_DIR, 'manifest.json');
  const manifestStats = await stat(manifestPath);
  const manifestBytes = await readFile(manifestPath);
  resources.push({
    name: 'manifest_json',
    path: path.posix.join(CURRENT_DIR, 'manifest.json'),
    format: 'json',
    mediatype: 'application/json',
    hash: buildSha256(manifestBytes),
    bytes: manifestStats.size,
  });

  const seenSources = new Set<string>();
  const uniqueSources = Object.values(manifest.source_urls)
    .flat()
    .filter(url => {
      if (seenSources.has(url)) return false;
      seenSources.add(url);
      return true;
    })
    .map(url => ({ path: url }));

  const descriptor = {
    profile: 'data-package',
    name: CATALOG_DESCRIPTOR_NAME,
    id: REPOSITORY_URL,
    title: PRODUCT_NAME,
    description: `${PRODUCT_NAME} - ${PRODUCT_SUBTITLE}. Static versioned artifacts are distributed from current/ and snapshots/.`,
    licenses: [
      {
        name: 'ODC-By-1.0',
        title: 'Open Data Commons Attribution License 1.0',
        path: 'https://opendatacommons.org/licenses/by/1-0/',
      },
    ],
    sources: uniqueSources,
    resources,
  };

  return `${JSON.stringify(descriptor, null, 2)}\n`;
}

export async function buildChangelogMarkdown(repoRoot: string): Promise<string> {
  const snapshotsDir = path.join(repoRoot, SNAPSHOTS_DIR);
  let snapshotEntries: string[] = [];

  try {
    snapshotEntries = (await readdir(snapshotsDir)).sort().reverse();
  } catch {
    snapshotEntries = [];
  }

  const lines = [
    '# Changelog',
    '',
    'Snapshots do catalogo derivado. Cada entrada descreve a promocao bem-sucedida de um snapshot para o repositorio.',
    '',
  ];

  for (const entry of snapshotEntries.slice(0, 30)) {
    const manifestPath = path.join(snapshotsDir, entry, 'manifest.json');
    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as SnapshotManifest;
      lines.push(`## ${manifest.snapshot_date}`);
      lines.push('');
      lines.push(`- Collected at: ${manifest.collected_at}`);
      lines.push(`- spi_participants: ${manifest.record_counts.spi_participants}`);
      lines.push(`- pix_active_participants: ${manifest.record_counts.pix_active_participants}`);
      lines.push(`- pix_in_adhesion: ${manifest.record_counts.pix_in_adhesion}`);
      lines.push(`- catalog_crosswalk: ${manifest.record_counts.catalog_crosswalk}`);
      if (manifest.warnings.length > 0) {
        lines.push(`- Warnings: ${manifest.warnings.length}`);
      }
      lines.push('');
    } catch {
      // Ignore malformed historical entries during changelog generation.
    }
  }

  return `${lines.join('\n')}\n`;
}

export async function buildSnapshotsMarkdown(repoRoot: string): Promise<string> {
  const snapshotsDir = path.join(repoRoot, SNAPSHOTS_DIR);
  let snapshotEntries: string[] = [];
  try {
    snapshotEntries = (await readdir(snapshotsDir)).sort().reverse();
  } catch {
    snapshotEntries = [];
  }

  const lines = [
    '# Snapshots',
    '',
    'Cada subdiretorio em `snapshots/YYYY-MM-DD/` representa um snapshot imutavel do catalogo derivado.',
    '',
    '| Snapshot | SPI | Pix ativos | Pix em adesao | Crosswalk | Validation |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
  ];

  for (const entry of snapshotEntries) {
    try {
      const manifest = JSON.parse(
        await readFile(path.join(snapshotsDir, entry, 'manifest.json'), 'utf8')
      ) as SnapshotManifest;
      lines.push(
        `| ${manifest.snapshot_date} | ${manifest.record_counts.spi_participants} | ${manifest.record_counts.pix_active_participants} | ${manifest.record_counts.pix_in_adhesion} | ${manifest.record_counts.catalog_crosswalk} | ${manifest.validation_status.status} |`
      );
    } catch {
      lines.push(`| ${entry} | n/a | n/a | n/a | n/a | invalid-manifest |`);
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

export async function writeDerivedDocs(repoRoot: string) {
  await mkdir(path.join(repoRoot, DOCS_DIR), { recursive: true });
  await writeFile(
    path.join(repoRoot, DOCS_DIR, 'changelog.md'),
    await buildChangelogMarkdown(repoRoot),
    'utf8'
  );
  await writeFile(
    path.join(repoRoot, DOCS_DIR, 'snapshots.md'),
    await buildSnapshotsMarkdown(repoRoot),
    'utf8'
  );
}

function buildInstitutionBase(
  ispb: string,
  name: string | null,
  shortName: string | null
): Institution {
  return {
    ispb,
    name: name ?? shortName ?? ispb,
    shortName: shortName ?? name ?? ispb,
    sourceDatasets: [],
  };
}

function mergeSourceDataset(
  current: readonly SourceDatasetName[],
  dataset: SourceDatasetName
): readonly SourceDatasetName[] {
  return current.includes(dataset) ? current : [...current, dataset];
}

function upsertInstitution(
  institutions: Map<string, Institution>,
  dataset: SourceDatasetName,
  record: CanonicalDatasets[SourceDatasetName][number]
) {
  if (!record.ispb) return;

  const current =
    institutions.get(record.ispb) ??
    buildInstitutionBase(record.ispb, record.institution_name, record.short_name);

  const next: Institution = {
    ispb: current.ispb,
    name: current.name || record.institution_name || record.short_name || record.ispb,
    shortName:
      current.shortName || record.short_name || record.institution_name || record.ispb,
    cnpj: current.cnpj ?? record.cnpj ?? undefined,
    spiParticipationType:
      current.spiParticipationType ?? record.spi_participation_type ?? undefined,
    pixParticipationType:
      current.pixParticipationType ?? record.pix_participation_type ?? undefined,
    pixParticipationMode:
      current.pixParticipationMode ?? record.pix_participation_mode ?? undefined,
    institutionType: current.institutionType ?? record.institution_type ?? undefined,
    authorizedByBcb:
      current.authorizedByBcb ?? record.is_authorized_by_bcb ?? undefined,
    sourceDatasets: mergeSourceDataset(current.sourceDatasets, dataset),
  };

  institutions.set(record.ispb, next);
}

function deriveMatchConfidence(ispb: string | null | undefined): MatchConfidence {
  return ispb ? 'exact_ispb' : 'derived';
}

function institutionToEntry(
  inst: Institution,
  canonicalSourceBase: string
): InstitutionEntry {
  const inSpi = inst.sourceDatasets.includes('spi_participants');
  const inPixActive = inst.sourceDatasets.includes('pix_active_participants');
  const inPixAdhesion = inst.sourceDatasets.includes('pix_in_adhesion');
  const matchConfidence: MatchConfidence = deriveMatchConfidence(inst.ispb);
  const canonicalSource = `${canonicalSourceBase}/current`;
  return {
    ...inst,
    inSpi,
    inPixActive,
    inPixAdhesion,
    matchConfidence,
    canonicalSource,
  };
}

export function buildPackageProjection(
  datasets: CanonicalDatasets,
  manifest: SnapshotManifest
): PackageProjection {
  const institutions = new Map<string, Institution>();

  for (const record of datasets.spi_participants) {
    upsertInstitution(institutions, 'spi_participants', record);
  }
  for (const record of datasets.pix_active_participants) {
    upsertInstitution(institutions, 'pix_active_participants', record);
  }
  for (const record of datasets.pix_in_adhesion) {
    upsertInstitution(institutions, 'pix_in_adhesion', record);
  }

  const sortedEntries = [...institutions.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([ispb, inst]) => [ispb, institutionToEntry(inst, REPOSITORY_URL)] as const);

  const sortedInstitutions = Object.fromEntries(sortedEntries);

  return {
    metadata: {
      source: 'ISPB Participants Catalog current snapshot',
      sourceUrl: `${REPOSITORY_URL}/tree/main/current`,
      sourceDate: manifest.snapshot_date,
      recordCount: Object.keys(sortedInstitutions).length,
    },
    catalogMetadata: {
      catalogUrl: REPOSITORY_URL,
      snapshotDate: manifest.snapshot_date,
      manifest,
      sources: manifest.source_urls,
    },
    institutions: sortedInstitutions,
    spiParticipants: datasets.spi_participants,
    pixActiveParticipants: datasets.pix_active_participants,
    pixInAdhesion: datasets.pix_in_adhesion,
  };
}

function renderGeneratedCurrentModule(projection: PackageProjection): string {
  return [
    '// AUTO-GENERATED - do not edit manually.',
    '// Source: ISPB Participants Catalog',
    '// To regenerate: npm run generate',
    '',
    "import type { InstitutionIndex, SpiParticipantRecord, PixActiveParticipantRecord, PixInAdhesionRecord } from '../catalog/types.js';",
    '',
    `export const INSTITUTIONS: InstitutionIndex = ${JSON.stringify(
      projection.institutions,
      null,
      2
    )} as const;`,
    '',
    `export const SPI_PARTICIPANTS: SpiParticipantRecord[] = ${JSON.stringify(
      projection.spiParticipants,
      null,
      2
    )};`,
    '',
    `export const PIX_ACTIVE_PARTICIPANTS: PixActiveParticipantRecord[] = ${JSON.stringify(
      projection.pixActiveParticipants,
      null,
      2
    )};`,
    '',
    `export const PIX_IN_ADHESION: PixInAdhesionRecord[] = ${JSON.stringify(
      projection.pixInAdhesion,
      null,
      2
    )};`,
    '',
  ].join('\n');
}

function renderGeneratedMetadataModule(projection: PackageProjection): string {
  return [
    '// AUTO-GENERATED - do not edit manually.',
    '// Source: ISPB Participants Catalog',
    '// To regenerate: npm run generate',
    '',
    "import type { CatalogMetadata, Metadata } from '../catalog/types.js';",
    '',
    `export const METADATA: Metadata = ${JSON.stringify(projection.metadata, null, 2)} as const;`,
    '',
    `export const CATALOG_METADATA: CatalogMetadata = ${JSON.stringify(
      projection.catalogMetadata,
      null,
      2
    )} as const;`,
    '',
  ].join('\n');
}

export async function writeGeneratedPackageFiles(
  repoRoot: string,
  projection: PackageProjection
) {
  const generatedRoot = path.join(repoRoot, GENERATED_DIR);
  await mkdir(generatedRoot, { recursive: true });
  await writeFile(
    path.join(generatedRoot, 'current.ts'),
    renderGeneratedCurrentModule(projection),
    'utf8'
  );
  await writeFile(
    path.join(generatedRoot, 'metadata.ts'),
    renderGeneratedMetadataModule(projection),
    'utf8'
  );
}

async function ensureCleanDirectory(targetDir: string) {
  await rm(targetDir, { force: true, recursive: true });
  await mkdir(targetDir, { recursive: true });
}

/** @deprecated Use the SSG in web/ (npm run build:web) instead. */
export async function buildPagesSite(repoRoot: string): Promise<string> {
  const { marked } = await import('marked');
  const siteRoot = path.join(repoRoot, SITE_DIR);
  await ensureCleanDirectory(siteRoot);

  const docPages = [
    ['index', 'index.md'],
    ['catalog', 'catalog.md'],
    ['datasets', 'datasets.md'],
    ['schemas', 'schemas.md'],
    ['snapshots', 'snapshots.md'],
    ['provenance', 'provenance.md'],
    ['update-policy', 'update-policy.md'],
    ['semantic-scope', 'semantic-scope.md'],
    ['licenses', 'licenses.md'],
    ['changelog', 'changelog.md'],
  ] as const;

  const nav = docPages
    .map(([slug]) => `<a href="${slug}.html">${slug === 'index' ? 'home' : slug}</a>`)
    .join(' | ');

  const chrome = `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${PRODUCT_NAME}</title>
  <style>
    :root {
      --ink: #16323f;
      --muted: #56717d;
      --line: #d9e1e5;
      --paper: #f7f8f8;
      --brand: #025c75;
    }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      margin: 0;
      background: linear-gradient(180deg, #f7f8f8 0%, #ffffff 100%);
    }
    header, main, footer {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px;
    }
    header {
      padding-top: 40px;
    }
    nav {
      margin-top: 12px;
      color: var(--muted);
    }
    nav a {
      color: var(--brand);
      text-decoration: none;
    }
    main {
      background: white;
      border: 1px solid var(--line);
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(2, 92, 117, 0.08);
      margin-bottom: 24px;
    }
    code, pre {
      font-family: "SFMono-Regular", Menlo, monospace;
      background: var(--paper);
    }
    pre {
      padding: 16px;
      overflow: auto;
      border-radius: 12px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 8px 10px;
      text-align: left;
    }
    footer {
      color: var(--muted);
      font-size: 0.95rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>${PRODUCT_NAME}</h1>
    <p>${PRODUCT_SUBTITLE}</p>
    <nav>${nav}</nav>
  </header>
  <main>__CONTENT__</main>
  <footer>
    <p>Static pages published from the repository. Catalog artifacts are available under <code>current/</code> and <code>snapshots/</code>.</p>
  </footer>
</body>
</html>`;

  for (const [slug, docFile] of docPages) {
    const markdown = await readFile(path.join(repoRoot, DOCS_DIR, docFile), 'utf8');
    const html = chrome.replace('__CONTENT__', await marked.parse(markdown));
    await writeFile(path.join(siteRoot, `${slug}.html`), html, 'utf8');
  }

  await cp(path.join(repoRoot, CURRENT_DIR), path.join(siteRoot, CURRENT_DIR), {
    recursive: true,
  });
  await cp(path.join(repoRoot, SNAPSHOTS_DIR), path.join(siteRoot, SNAPSHOTS_DIR), {
    recursive: true,
  });
  await cp(path.join(repoRoot, SCHEMAS_DIR), path.join(siteRoot, SCHEMAS_DIR), {
    recursive: true,
  });
  await cp(path.join(repoRoot, 'datapackage.json'), path.join(siteRoot, 'datapackage.json'));
  await cp(path.join(repoRoot, 'LICENSE'), path.join(siteRoot, 'LICENSE'));
  await cp(path.join(repoRoot, 'LICENSE_DATA'), path.join(siteRoot, 'LICENSE_DATA'));

  return siteRoot;
}
