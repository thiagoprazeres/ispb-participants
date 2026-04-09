import { asciiFold, normalizeIspb } from './catalog/normalize.js';
import type {
  CatalogMetadata,
  Institution,
  InstitutionEntry,
  InstitutionStatus,
  MatchConfidence,
  Metadata,
  PixActiveParticipantRecord,
  PixInAdhesionRecord,
  SnapshotManifest,
  SpiParticipantRecord,
  ValidationIssue,
} from './catalog/types.js';
import {
  INSTITUTIONS,
  PIX_ACTIVE_PARTICIPANTS,
  PIX_IN_ADHESION,
  SPI_PARTICIPANTS,
} from './generated/current.js';
import { CATALOG_METADATA, METADATA } from './generated/metadata.js';

export type {
  CatalogMetadata,
  Institution,
  InstitutionEntry,
  InstitutionStatus,
  MatchConfidence,
  Metadata,
  PixActiveParticipantRecord,
  PixInAdhesionRecord,
  SnapshotManifest,
  SpiParticipantRecord,
  ValidationIssue,
} from './catalog/types.js';

export { INSTITUTIONS, SPI_PARTICIPANTS, PIX_ACTIVE_PARTICIPANTS, PIX_IN_ADHESION };

function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

export function getInstitutionByIspb(ispb: string): InstitutionEntry | undefined {
  return INSTITUTIONS[normalizeIspb(ispb)];
}

export function getSpiParticipantByIspb(ispb: string): SpiParticipantRecord | undefined {
  const normalized = normalizeIspb(ispb);
  return SPI_PARTICIPANTS.find(r => r.ispb === normalized);
}

export function getPixActiveParticipantByIspb(
  ispb: string
): PixActiveParticipantRecord | undefined {
  const normalized = normalizeIspb(ispb);
  return PIX_ACTIVE_PARTICIPANTS.find(r => r.ispb === normalized);
}

export function getInstitutionStatusByIspb(ispb: string): InstitutionStatus | undefined {
  const entry = INSTITUTIONS[normalizeIspb(ispb)];
  if (!entry) return undefined;
  return {
    inSpi: entry.inSpi,
    inPixActive: entry.inPixActive,
    inPixAdhesion: entry.inPixAdhesion,
    matchConfidence: entry.matchConfidence,
    canonicalSource: entry.canonicalSource,
  };
}

export function searchInstitutionsByName(query: string): InstitutionEntry[] {
  const foldedQuery = asciiFold(query.trim());
  return Object.values(INSTITUTIONS).filter(inst => {
    return (
      asciiFold(inst.name).includes(foldedQuery) ||
      asciiFold(inst.shortName).includes(foldedQuery)
    );
  });
}

/** @deprecated Use getInstitutionByIspb() instead. */
export function getInstitution(ispb: string): InstitutionEntry | undefined {
  return getInstitutionByIspb(ispb);
}

export function hasIspb(ispb: string): boolean {
  return normalizeIspb(ispb) in INSTITUTIONS;
}

/** @deprecated Use searchInstitutionsByName() instead. */
export function searchInstitutions(query: string): InstitutionEntry[] {
  return searchInstitutionsByName(query);
}

export function getMetadata(): Metadata {
  return clone(METADATA);
}

export function getCatalogMetadata(): CatalogMetadata {
  return clone(CATALOG_METADATA as unknown as CatalogMetadata);
}

