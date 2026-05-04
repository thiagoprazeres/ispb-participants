import type { DatasetName } from './types.js';

export const PRODUCT_NAME = 'ISPB Participants Catalog';
export const PRODUCT_SUBTITLE =
  'Catálogo público derivado de fonte oficial do Banco Central';
export const PACKAGE_NPM_NAME = '@cafeina_dev/ispb-participants';
export const CATALOG_DESCRIPTOR_NAME = 'ispb-participants-catalog';
export const REPOSITORY_URL = 'https://github.com/cafeinadesign/ispb-participants';
export const PIPELINE_VERSION = '2026.04.09';

export const CURRENT_DIR = 'current';
export const SNAPSHOTS_DIR = 'snapshots';
export const SCHEMAS_DIR = 'schemas';
export const SOURCES_DIR = 'sources';
export const DOCS_DIR = 'docs';
export const SITE_DIR = 'site';
export const GENERATED_DIR = 'src/generated';

export const DEFAULT_TIMEOUT_MS = 30_000;
export const HEADLESS_RENDER_BUDGET_MS = 20_000;

export const REQUIRED_OUTPUT_FILES = [
  'spi_participants.csv',
  'spi_participants.json',
  'pix_active_participants.csv',
  'pix_active_participants.json',
  'pix_in_adhesion.csv',
  'pix_in_adhesion.json',
  'catalog_crosswalk.csv',
  'catalog_crosswalk.json',
  'manifest.json',
] as const;

export const SCHEMA_VERSIONS = {
  spi_participants: '1.0.0',
  pix_active_participants: '1.0.0',
  pix_in_adhesion: '1.0.0',
  catalog_crosswalk: '1.0.0',
} as const;

export const DATASET_HEADER_MAP: Record<DatasetName, readonly string[]> = {
  spi_participants: [
    'dataset',
    'source_record_id',
    'ispb',
    'cnpj',
    'institution_name',
    'short_name',
    'institution_type',
    'spi_participation_type',
    'pix_participation_type',
    'pix_participation_mode',
    'is_authorized_by_bcb',
    'catalog_snapshot_date',
    'source_registry_id',
    'source_file_url',
    'source_publication_date',
    'schema_version',
    'raw_modalidade_participacao_pix_code',
    'raw_tipo_participante_spi_code',
    'spi_started_at',
    'raw_source_json',
  ],
  pix_active_participants: [
    'dataset',
    'source_record_id',
    'ispb',
    'cnpj',
    'institution_name',
    'short_name',
    'institution_type',
    'spi_participation_type',
    'pix_participation_type',
    'pix_participation_mode',
    'is_authorized_by_bcb',
    'catalog_snapshot_date',
    'source_registry_id',
    'source_file_url',
    'source_publication_date',
    'schema_version',
    'initiation_of_payment',
    'facilitator_of_withdrawal_and_change',
    'raw_source_json',
  ],
  pix_in_adhesion: [
    'dataset',
    'source_record_id',
    'ispb',
    'cnpj',
    'institution_name',
    'short_name',
    'institution_type',
    'spi_participation_type',
    'pix_participation_type',
    'pix_participation_mode',
    'is_authorized_by_bcb',
    'catalog_snapshot_date',
    'source_registry_id',
    'source_file_url',
    'source_publication_date',
    'schema_version',
    'adhesion_status',
    'raw_source_json',
  ],
  catalog_crosswalk: [
    'dataset',
    'catalog_entity_id',
    'source_dataset',
    'source_record_id',
    'source_snapshot_date',
    'match_method',
    'match_basis',
    'linked_ispb',
    'linked_cnpj',
    'linked_name',
    'source_registry_id',
    'source_file_url',
    'source_publication_date',
    'catalog_snapshot_date',
    'schema_version',
  ],
};

export const SPI_PARTICIPATION_CODE_MAP: Record<string, string> = {
  DRCT: 'Direta',
  IDRT: 'Indireta',
};

export const PIX_MODE_CODE_MAP: Record<string, string> = {
  PDCT: 'Provedor de Conta Transacional',
  GOVE: 'Ente Governamental',
  LESP: 'Liquidante Especial',
};

export const PIX_SECTION_ACTIVE = 'Lista de participantes ativos do Pix';
export const PIX_SECTION_ADHESION =
  'Lista de instituicoes em processo de adesao ao Pix';

const draft = 'https://json-schema.org/draft/2020-12/schema';

const nullableString = (description: string, pattern?: string) => ({
  type: ['string', 'null'],
  description,
  ...(pattern ? { pattern } : {}),
});

const nullableBoolean = (description: string) => ({
  type: ['boolean', 'null'],
  description,
});

const baseProperties = {
  dataset: {
    type: 'string',
    description: 'Canonical dataset name in the catalog.',
  },
  source_record_id: {
    type: 'string',
    description: 'Stable per-snapshot identifier for the source row.',
  },
  ispb: nullableString('Eight-digit ISPB when available.', '^\\d{8}$'),
  cnpj: nullableString('Fourteen-digit CNPJ when available.', '^\\d{14}$'),
  institution_name: nullableString(
    'Normalized institution name derived from the official source.'
  ),
  short_name: nullableString(
    'Reduced or short institution name derived from the official source.'
  ),
  institution_type: nullableString(
    'Institution type as published by the official source.'
  ),
  spi_participation_type: nullableString(
    'SPI participation type in normalized human-readable form.'
  ),
  pix_participation_type: nullableString(
    'Pix participation type in normalized human-readable form.'
  ),
  pix_participation_mode: nullableString(
    'Pix participation mode in normalized human-readable form.'
  ),
  is_authorized_by_bcb: nullableBoolean(
    'Whether the institution is authorized by Banco Central do Brasil.'
  ),
  catalog_snapshot_date: {
    type: 'string',
    description: 'Catalog snapshot date in YYYY-MM-DD format.',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  },
  source_registry_id: {
    type: 'string',
    description: 'Identifier of the official source entry in sources/registry.json.',
  },
  source_file_url: {
    type: 'string',
    description: 'Direct official source artifact URL used for derivation.',
  },
  source_publication_date: nullableString(
    'Official publication date when available.',
    '^\\d{4}-\\d{2}-\\d{2}$'
  ),
  schema_version: {
    type: 'string',
    description: 'Schema version used to validate this record.',
  },
  raw_source_json: {
    type: 'string',
    description:
      'JSON-serialized raw source row. New upstream columns are preserved here first.',
  },
} as const;

export const spiParticipantsSchema = {
  $schema: draft,
  $id: `${REPOSITORY_URL}/schemas/spi_participants.schema.json`,
  title: 'spi_participants',
  description:
    'Schema for the SPI participants dataset derived from the official Banco Central SPI participant publication.',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...baseProperties,
    dataset: {
      type: 'string',
      const: 'spi_participants',
      description: 'Canonical dataset name.',
    },
    raw_modalidade_participacao_pix_code: nullableString(
      'Raw Pix participation mode code from the SPI source.'
    ),
    raw_tipo_participante_spi_code: nullableString(
      'Raw SPI participation code from the SPI source.'
    ),
    spi_started_at: nullableString(
      'Official SPI operation start timestamp in ISO-8601 format.'
    ),
  },
  required: [
    'dataset',
    'source_record_id',
    'ispb',
    'cnpj',
    'institution_name',
    'short_name',
    'catalog_snapshot_date',
    'source_registry_id',
    'source_file_url',
    'source_publication_date',
    'schema_version',
    'raw_source_json',
    'raw_modalidade_participacao_pix_code',
    'raw_tipo_participante_spi_code',
    'spi_started_at',
  ],
} as const;

export const pixActiveParticipantsSchema = {
  $schema: draft,
  $id: `${REPOSITORY_URL}/schemas/pix_active_participants.schema.json`,
  title: 'pix_active_participants',
  description:
    'Schema for the active Pix participants dataset derived from the official Banco Central Pix participant publication.',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...baseProperties,
    dataset: {
      type: 'string',
      const: 'pix_active_participants',
      description: 'Canonical dataset name.',
    },
    initiation_of_payment: nullableBoolean(
      'Whether the institution is an initiator of payment in the Pix source.'
    ),
    facilitator_of_withdrawal_and_change: nullableBoolean(
      'Whether the institution is marked as FSS in the Pix source.'
    ),
  },
  required: [
    'dataset',
    'source_record_id',
    'ispb',
    'cnpj',
    'institution_name',
    'short_name',
    'institution_type',
    'spi_participation_type',
    'pix_participation_type',
    'pix_participation_mode',
    'is_authorized_by_bcb',
    'catalog_snapshot_date',
    'source_registry_id',
    'source_file_url',
    'source_publication_date',
    'schema_version',
    'raw_source_json',
    'initiation_of_payment',
    'facilitator_of_withdrawal_and_change',
  ],
} as const;

export const pixInAdhesionSchema = {
  $schema: draft,
  $id: `${REPOSITORY_URL}/schemas/pix_in_adhesion.schema.json`,
  title: 'pix_in_adhesion',
  description:
    'Schema for the Pix institutions in adhesion dataset derived from the official Banco Central Pix participant publication.',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...baseProperties,
    dataset: {
      type: 'string',
      const: 'pix_in_adhesion',
      description: 'Canonical dataset name.',
    },
    adhesion_status: nullableString(
      'Official adhesion status as published by Banco Central.'
    ),
  },
  required: [
    'dataset',
    'source_record_id',
    'ispb',
    'cnpj',
    'institution_name',
    'short_name',
    'institution_type',
    'spi_participation_type',
    'pix_participation_type',
    'pix_participation_mode',
    'is_authorized_by_bcb',
    'catalog_snapshot_date',
    'source_registry_id',
    'source_file_url',
    'source_publication_date',
    'schema_version',
    'raw_source_json',
    'adhesion_status',
  ],
} as const;

export const catalogCrosswalkSchema = {
  $schema: draft,
  $id: `${REPOSITORY_URL}/schemas/catalog_crosswalk.schema.json`,
  title: 'catalog_crosswalk',
  description:
    'Schema for the conservative crosswalk that links source rows without silently inventing equivalences.',
  type: 'object',
  additionalProperties: false,
  properties: {
    dataset: {
      type: 'string',
      const: 'catalog_crosswalk',
      description: 'Canonical dataset name.',
    },
    catalog_entity_id: {
      type: 'string',
      description: 'Stable derived catalog entity identifier.',
    },
    source_dataset: {
      type: 'string',
      description: 'Origin dataset for this crosswalk row.',
    },
    source_record_id: {
      type: 'string',
      description: 'Origin source record identifier.',
    },
    source_snapshot_date: {
      type: 'string',
      description: 'Origin snapshot date in YYYY-MM-DD format.',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    },
    match_method: {
      type: 'string',
      enum: ['exact_ispb', 'unique_cnpj', 'no_auto_match'],
      description: 'Matching method used by the crosswalk.',
    },
    match_basis: {
      type: 'string',
      description: 'Human-readable explanation of the matching basis.',
    },
    linked_ispb: nullableString('Linked ISPB when available.', '^\\d{8}$'),
    linked_cnpj: nullableString('Linked CNPJ when available.', '^\\d{14}$'),
    linked_name: nullableString('Linked institution name when available.'),
    source_registry_id: {
      type: 'string',
      description: 'Source registry entry identifier.',
    },
    source_file_url: {
      type: 'string',
      description: 'Direct official source artifact URL used for derivation.',
    },
    source_publication_date: nullableString(
      'Official publication date when available.',
      '^\\d{4}-\\d{2}-\\d{2}$'
    ),
    catalog_snapshot_date: {
      type: 'string',
      description: 'Catalog snapshot date in YYYY-MM-DD format.',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    },
    schema_version: {
      type: 'string',
      description: 'Schema version used to validate this row.',
    },
  },
  required: [
    'dataset',
    'catalog_entity_id',
    'source_dataset',
    'source_record_id',
    'source_snapshot_date',
    'match_method',
    'match_basis',
    'linked_ispb',
    'linked_cnpj',
    'linked_name',
    'source_registry_id',
    'source_file_url',
    'source_publication_date',
    'catalog_snapshot_date',
    'schema_version',
  ],
} as const;

export const schemaMap = {
  spi_participants: spiParticipantsSchema,
  pix_active_participants: pixActiveParticipantsSchema,
  pix_in_adhesion: pixInAdhesionSchema,
  catalog_crosswalk: catalogCrosswalkSchema,
} as const;

export const schemaVersions = {
  ...SCHEMA_VERSIONS,
} as const;

