export const DATASET_NAMES = [
  'spi_participants',
  'pix_active_participants',
  'pix_in_adhesion',
  'catalog_crosswalk',
] as const;

export const SOURCE_DATASET_NAMES = [
  'spi_participants',
  'pix_active_participants',
  'pix_in_adhesion',
] as const;

export type DatasetName = (typeof DATASET_NAMES)[number];
export type SourceDatasetName = (typeof SOURCE_DATASET_NAMES)[number];
export type PipelineStage = 'fetch' | 'parse' | 'schema' | 'semantic' | 'promotion';

export class PipelineStageError extends Error {
  readonly stage: PipelineStage;
  readonly dataset?: DatasetName | 'catalog';

  constructor(stage: PipelineStage, message: string, dataset?: DatasetName | 'catalog') {
    super(message);
    this.name = 'PipelineStageError';
    this.stage = stage;
    this.dataset = dataset;
  }
}

export interface SourceRegistryEntry {
  id: string;
  dataset: SourceDatasetName;
  official_page_url: string;
  official_page_api_url: string;
  content_identifier: string;
  expected_title_pattern: string;
  preferred_format: 'csv' | 'pdf';
  accepted_fallback_formats: string[];
  notes: string;
  license_notice: string;
}

export interface ResolvedSource {
  registry: SourceRegistryEntry;
  officialPageUrl: string;
  officialPageApiUrl: string;
  pdfUrl: string;
  csvUrl: string;
  pdfTitle: string;
  sourcePublicationDate: string | null;
}

export interface BaseRecord {
  dataset: DatasetName;
  source_record_id: string;
  ispb: string | null;
  cnpj: string | null;
  institution_name: string | null;
  short_name: string | null;
  institution_type: string | null;
  spi_participation_type: string | null;
  pix_participation_type: string | null;
  pix_participation_mode: string | null;
  is_authorized_by_bcb: boolean | null;
  catalog_snapshot_date: string;
  source_registry_id: string;
  source_file_url: string;
  source_publication_date: string | null;
  schema_version: string;
  raw_source_json: string;
}

export interface SpiParticipantRecord extends BaseRecord {
  dataset: 'spi_participants';
  raw_modalidade_participacao_pix_code: string | null;
  raw_tipo_participante_spi_code: string | null;
  spi_started_at: string | null;
}

export interface PixActiveParticipantRecord extends BaseRecord {
  dataset: 'pix_active_participants';
  initiation_of_payment: boolean | null;
  facilitator_of_withdrawal_and_change: boolean | null;
}

export interface PixInAdhesionRecord extends BaseRecord {
  dataset: 'pix_in_adhesion';
  adhesion_status: string | null;
}

export interface CatalogCrosswalkRecord {
  dataset: 'catalog_crosswalk';
  catalog_entity_id: string;
  source_dataset: SourceDatasetName;
  source_record_id: string;
  source_snapshot_date: string;
  match_method: 'exact_ispb' | 'unique_cnpj' | 'no_auto_match';
  match_basis: string;
  linked_ispb: string | null;
  linked_cnpj: string | null;
  linked_name: string | null;
  source_registry_id: string;
  source_file_url: string;
  source_publication_date: string | null;
  catalog_snapshot_date: string;
  schema_version: string;
}

export type DatasetRecord =
  | SpiParticipantRecord
  | PixActiveParticipantRecord
  | PixInAdhesionRecord
  | CatalogCrosswalkRecord;

export interface CanonicalDatasets {
  spi_participants: SpiParticipantRecord[];
  pix_active_participants: PixActiveParticipantRecord[];
  pix_in_adhesion: PixInAdhesionRecord[];
  catalog_crosswalk: CatalogCrosswalkRecord[];
}

export interface DatasetArtifacts<T extends DatasetRecord> {
  name: DatasetName;
  records: T[];
  csv: string;
  json: string;
  rowCount: number;
  schemaVersion: string;
}

export interface ValidationIssue {
  severity: 'warning' | 'error';
  dataset: DatasetName | 'catalog';
  message: string;
  stage?: PipelineStage;
}

export interface ValidationSummary {
  ok: boolean;
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  checks: string[];
}

export interface SnapshotManifest {
  snapshot_date: string;
  collected_at: string;
  source_urls: Record<string, string[]>;
  source_publication_dates: Record<string, string | null>;
  dataset_hashes: Record<string, Record<string, string>>;
  record_counts: Record<string, number>;
  schema_versions: Record<string, string>;
  pipeline_version: string;
  validation_status: {
    status: 'passed' | 'failed';
    checks: string[];
  };
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
}

export interface FetchedCatalogSources {
  collectedAt: string;
  sources: Record<SourceDatasetName, ResolvedSource>;
  raw: {
    spiCsvText: string;
    pixCsvText: string;
  };
}

export interface CatalogBuildResult {
  snapshotDate: string;
  collectedAt: string;
  sources: Record<SourceDatasetName, ResolvedSource>;
  datasets: CanonicalDatasets;
  artifacts: Record<DatasetName, DatasetArtifacts<DatasetRecord>>;
  validation: ValidationSummary;
  manifest: SnapshotManifest;
}

export interface Institution {
  ispb: string;
  name: string;
  shortName: string;
  cnpj?: string;
  spiParticipationType?: string;
  pixParticipationType?: string;
  pixParticipationMode?: string;
  institutionType?: string;
  authorizedByBcb?: boolean;
  sourceDatasets: readonly SourceDatasetName[];
}

export type MatchConfidence = 'exact_ispb' | 'unique_cnpj' | 'no_auto_match' | 'derived';

export interface InstitutionEntry {
  ispb: string;
  name: string;
  shortName: string;
  cnpj?: string;
  spiParticipationType?: string;
  pixParticipationType?: string;
  pixParticipationMode?: string;
  institutionType?: string;
  authorizedByBcb?: boolean;
  sourceDatasets: readonly SourceDatasetName[];
  inSpi: boolean;
  inPixActive: boolean;
  inPixAdhesion: boolean;
  matchConfidence: MatchConfidence;
  canonicalSource: string;
}

export interface InstitutionStatus {
  inSpi: boolean;
  inPixActive: boolean;
  inPixAdhesion: boolean;
  matchConfidence: MatchConfidence;
  canonicalSource: string;
}

export type InstitutionIndex = Record<string, InstitutionEntry>;

export interface Metadata {
  source: string;
  sourceUrl: string;
  snapshotDate: string;
  spiParticipantCount: number;
  pixActiveParticipantCount: number;
  pixInAdhesionCount: number;
  crosswalkRecordCount: number;
  /** @deprecated Use snapshotDate instead. */
  sourceDate: string;
  /** @deprecated Use pixActiveParticipantCount instead. This is not a catalog-wide total. */
  recordCount: number;
}

export interface CatalogMetadata {
  catalogUrl: string;
  snapshotDate: string;
  spiParticipantCount: number;
  pixActiveParticipantCount: number;
  pixInAdhesionCount: number;
  crosswalkRecordCount: number;
  manifest: SnapshotManifest;
  sources: Record<string, readonly string[]>;
}

export interface PackageProjection {
  metadata: Metadata;
  catalogMetadata: CatalogMetadata;
  institutions: InstitutionIndex;
  spiParticipants: SpiParticipantRecord[];
  pixActiveParticipants: PixActiveParticipantRecord[];
  pixInAdhesion: PixInAdhesionRecord[];
}
