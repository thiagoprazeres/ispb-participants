import { asciiFold, normalizeIspb } from './catalog/normalize.js';
import type {
  CatalogMetadata,
  Institution,
  Metadata,
  SnapshotManifest,
  ValidationIssue,
} from './catalog/types.js';
import { INSTITUTIONS } from './generated/current.js';
import { CATALOG_METADATA, METADATA } from './generated/metadata.js';

export type {
  CatalogMetadata,
  Institution,
  Metadata,
  SnapshotManifest,
  ValidationIssue,
} from './catalog/types.js';

export { INSTITUTIONS };

function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

export function getInstitution(ispb: string) {
  return INSTITUTIONS[normalizeIspb(ispb)];
}

export function hasIspb(ispb: string): boolean {
  return normalizeIspb(ispb) in INSTITUTIONS;
}

export function searchInstitutions(query: string) {
  const foldedQuery = asciiFold(query.trim());
  return Object.values(INSTITUTIONS).filter(inst => {
    return (
      asciiFold(inst.name).includes(foldedQuery) ||
      asciiFold(inst.shortName).includes(foldedQuery)
    );
  });
}

export function getMetadata(): Metadata {
  return clone(METADATA);
}

export function getCatalogMetadata(): CatalogMetadata {
  return clone(CATALOG_METADATA as unknown as CatalogMetadata);
}

