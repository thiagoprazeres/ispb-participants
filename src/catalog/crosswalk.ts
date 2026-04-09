import { schemaVersions } from './schemas.js';
import type {
  CatalogCrosswalkRecord,
  PixActiveParticipantRecord,
  PixInAdhesionRecord,
  SpiParticipantRecord,
  ValidationIssue,
} from './types.js';

export function buildCrosswalk(
  snapshotDate: string,
  datasets: {
    spi: SpiParticipantRecord[];
    pixActive: PixActiveParticipantRecord[];
    pixInAdhesion: PixInAdhesionRecord[];
  }
): { records: CatalogCrosswalkRecord[]; warnings: ValidationIssue[] } {
  const linkableRecords = [
    ...datasets.spi,
    ...datasets.pixActive,
    ...datasets.pixInAdhesion,
  ];

  const cnpjsWithIspb = new Set(
    linkableRecords.filter(record => record.ispb && record.cnpj).map(record => record.cnpj!)
  );

  const cnpjCountsWithoutIspb = new Map<string, number>();
  for (const record of linkableRecords) {
    if (!record.ispb && record.cnpj) {
      cnpjCountsWithoutIspb.set(record.cnpj, (cnpjCountsWithoutIspb.get(record.cnpj) ?? 0) + 1);
    }
  }

  const warnings: ValidationIssue[] = [];
  for (const [cnpj, count] of cnpjCountsWithoutIspb.entries()) {
    if (count > 1 || cnpjsWithIspb.has(cnpj)) {
      warnings.push({
        severity: 'warning',
        dataset: 'catalog_crosswalk',
        stage: 'semantic',
        message: `No-ISPB CNPJ ${cnpj} was kept conservative in the crosswalk because it is ambiguous or conflicts with an ISPB-bearing record.`,
      });
    }
  }

  const records: CatalogCrosswalkRecord[] = linkableRecords.map(record => {
    if (record.ispb) {
      return {
        dataset: 'catalog_crosswalk',
        catalog_entity_id: `ispb:${record.ispb}`,
        source_dataset: record.dataset,
        source_record_id: record.source_record_id,
        source_snapshot_date: snapshotDate,
        match_method: 'exact_ispb',
        match_basis: `ispb=${record.ispb}`,
        linked_ispb: record.ispb,
        linked_cnpj: record.cnpj,
        linked_name: record.institution_name ?? record.short_name,
        source_registry_id: record.source_registry_id,
        source_file_url: record.source_file_url,
        source_publication_date: record.source_publication_date,
        catalog_snapshot_date: snapshotDate,
        schema_version: schemaVersions.catalog_crosswalk,
      };
    }

    const canUseUniqueCnpj =
      !!record.cnpj &&
      (cnpjCountsWithoutIspb.get(record.cnpj) ?? 0) === 1 &&
      !cnpjsWithIspb.has(record.cnpj);

    if (canUseUniqueCnpj) {
      return {
        dataset: 'catalog_crosswalk',
        catalog_entity_id: `cnpj:${record.cnpj!}`,
        source_dataset: record.dataset,
        source_record_id: record.source_record_id,
        source_snapshot_date: snapshotDate,
        match_method: 'unique_cnpj',
        match_basis: `cnpj=${record.cnpj} (unique among records without ispb)`,
        linked_ispb: null,
        linked_cnpj: record.cnpj,
        linked_name: record.institution_name ?? record.short_name,
        source_registry_id: record.source_registry_id,
        source_file_url: record.source_file_url,
        source_publication_date: record.source_publication_date,
        catalog_snapshot_date: snapshotDate,
        schema_version: schemaVersions.catalog_crosswalk,
      };
    }

    return {
      dataset: 'catalog_crosswalk',
      catalog_entity_id: `${record.dataset}:${record.source_record_id}`,
      source_dataset: record.dataset,
      source_record_id: record.source_record_id,
      source_snapshot_date: snapshotDate,
      match_method: 'no_auto_match',
      match_basis: record.cnpj
        ? `cnpj=${record.cnpj} was ambiguous or conflicted with an ISPB-bearing record`
        : 'record has no ispb and no usable unique cnpj',
      linked_ispb: null,
      linked_cnpj: record.cnpj,
      linked_name: record.institution_name ?? record.short_name,
      source_registry_id: record.source_registry_id,
      source_file_url: record.source_file_url,
      source_publication_date: record.source_publication_date,
      catalog_snapshot_date: snapshotDate,
      schema_version: schemaVersions.catalog_crosswalk,
    };
  });

  return { records, warnings };
}

