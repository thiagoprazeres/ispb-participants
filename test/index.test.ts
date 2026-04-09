import { describe, it, expect } from 'vitest';
import {
  INSTITUTIONS,
  SPI_PARTICIPANTS,
  PIX_ACTIVE_PARTICIPANTS,
  PIX_IN_ADHESION,
  getCatalogMetadata,
  getInstitution,
  getInstitutionByIspb,
  getInstitutionStatusByIspb,
  getPixActiveParticipantByIspb,
  getSpiParticipantByIspb,
  hasIspb,
  searchInstitutions,
  searchInstitutionsByName,
  getMetadata,
} from '../src/index.js';

function explicitIspbs(records: Array<{ ispb: string | null }>): string[] {
  return [...new Set(records.flatMap(record => (record.ispb ? [record.ispb] : [])))].sort();
}

describe('INSTITUTIONS', () => {
  it('has a broad national participant index', () => {
    expect(Object.keys(INSTITUTIONS).length).toBeGreaterThan(850);
  });

  it('returns Institution record with expected shape', () => {
    const inst = INSTITUTIONS['60746948'];
    expect(inst).toBeDefined();
    expect(inst?.ispb).toBe('60746948');
    expect(inst?.name.toLowerCase()).toBe('banco bradesco s.a.');
    expect(typeof inst?.shortName).toBe('string');
    expect(inst?.sourceDatasets).toContain('spi_participants');
  });

  it('contains every explicit ISPB from the canonical datasets', () => {
    const datasets = [
      { name: 'SPI_PARTICIPANTS', records: SPI_PARTICIPANTS },
      { name: 'PIX_ACTIVE_PARTICIPANTS', records: PIX_ACTIVE_PARTICIPANTS },
      { name: 'PIX_IN_ADHESION', records: PIX_IN_ADHESION },
    ] as const;

    for (const dataset of datasets) {
      for (const ispb of explicitIspbs(dataset.records)) {
        expect(INSTITUTIONS[ispb], `${dataset.name} ispb ${ispb}`).toBeDefined();
      }
    }
  });
});

describe('getInstitution', () => {
  it('returns full record for known ISPB', () => {
    const inst = getInstitution('60746948');
    expect(inst?.name.toLowerCase()).toBe('banco bradesco s.a.');
    expect(inst?.ispb).toBe('60746948');
    expect(inst?.sourceDatasets.length).toBeGreaterThan(0);
  });

  it('returns undefined for unknown ISPB', () => {
    expect(getInstitution('99999999')).toBeUndefined();
  });
});

describe('hasIspb', () => {
  it('returns true for known ISPB', () => {
    expect(hasIspb('60746948')).toBe(true);
  });

  it('returns false for unknown ISPB', () => {
    expect(hasIspb('99999999')).toBe(false);
  });
});

describe('searchInstitutions', () => {
  it('finds by partial name (case-insensitive)', () => {
    const results = searchInstitutions('bradesco');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name.toLowerCase()).toContain('bradesco');
  });

  it('returns empty array for no match', () => {
    expect(searchInstitutions('xyznotexistent12345')).toEqual([]);
  });
});

describe('getMetadata', () => {
  it('returns correct shape', () => {
    const meta = getMetadata();
    expect(meta.source).toBeTruthy();
    expect(meta.sourceUrl).toContain('thiagoprazeres/ispb-participants');
    expect(meta.sourceUrl).toContain('/current');
    expect(meta.snapshotDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(meta.spiParticipantCount).toBeGreaterThan(0);
    expect(meta.pixActiveParticipantCount).toBeGreaterThan(0);
    expect(meta.pixInAdhesionCount).toBeGreaterThanOrEqual(0);
    expect(meta.crosswalkRecordCount).toBeGreaterThan(0);
    expect(meta.sourceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(meta.recordCount).toBe(meta.pixActiveParticipantCount);
  });
});

describe('getCatalogMetadata', () => {
  it('returns promoted catalog metadata', () => {
    const metadata = getCatalogMetadata();
    expect(metadata.catalogUrl).toContain('thiagoprazeres/ispb-participants');
    expect(metadata.snapshotDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(metadata.spiParticipantCount).toBe(metadata.manifest.record_counts.spi_participants);
    expect(metadata.pixActiveParticipantCount).toBe(
      metadata.manifest.record_counts.pix_active_participants
    );
    expect(metadata.pixInAdhesionCount).toBe(metadata.manifest.record_counts.pix_in_adhesion);
    expect(metadata.crosswalkRecordCount).toBe(
      metadata.manifest.record_counts.catalog_crosswalk
    );
    expect(metadata.manifest.snapshot_date).toBe(metadata.snapshotDate);
    expect(metadata.manifest.validation_status.status).toBe('passed');
    expect(metadata.sources.spi_participants.some(url => url.includes('bcb.gov.br'))).toBe(true);
  });
});

describe('InstitutionEntry shape', () => {
  it('every INSTITUTIONS entry has the required InstitutionEntry fields', () => {
    const entries = Object.values(INSTITUTIONS);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(typeof entry.inSpi).toBe('boolean');
      expect(typeof entry.inPixActive).toBe('boolean');
      expect(typeof entry.inPixAdhesion).toBe('boolean');
      expect(['exact_ispb', 'unique_cnpj', 'no_auto_match', 'derived']).toContain(
        entry.matchConfidence
      );
      expect(typeof entry.canonicalSource).toBe('string');
      expect(entry.canonicalSource).toContain('github.com');
    }
  });

  it('Bradesco is in SPI and Pix active, not in adhesion', () => {
    const entry = INSTITUTIONS['60746948'];
    expect(entry?.inSpi).toBe(true);
    expect(entry?.inPixActive).toBe(true);
    expect(entry?.inPixAdhesion).toBe(false);
    expect(entry?.matchConfidence).toBe('exact_ispb');
  });

  it('no entry has undefined matchConfidence', () => {
    for (const entry of Object.values(INSTITUTIONS)) {
      expect(entry.matchConfidence).toBeDefined();
    }
  });
});

describe('Canonical arrays', () => {
  it('SPI_PARTICIPANTS is a non-empty array', () => {
    expect(Array.isArray(SPI_PARTICIPANTS)).toBe(true);
    expect(SPI_PARTICIPANTS.length).toBeGreaterThan(500);
    expect(SPI_PARTICIPANTS[0]?.dataset).toBe('spi_participants');
  });

  it('PIX_ACTIVE_PARTICIPANTS is a non-empty array', () => {
    expect(Array.isArray(PIX_ACTIVE_PARTICIPANTS)).toBe(true);
    expect(PIX_ACTIVE_PARTICIPANTS.length).toBeGreaterThan(500);
    expect(PIX_ACTIVE_PARTICIPANTS[0]?.dataset).toBe('pix_active_participants');
  });

  it('PIX_IN_ADHESION is a non-empty array', () => {
    expect(Array.isArray(PIX_IN_ADHESION)).toBe(true);
    expect(PIX_IN_ADHESION.length).toBeGreaterThan(0);
    expect(PIX_IN_ADHESION[0]?.dataset).toBe('pix_in_adhesion');
  });
});

describe('getInstitutionByIspb', () => {
  it('returns InstitutionEntry for known ISPB', () => {
    const entry = getInstitutionByIspb('60746948');
    expect(entry?.ispb).toBe('60746948');
    expect(entry?.name.toLowerCase()).toBe('banco bradesco s.a.');
    expect(typeof entry?.inSpi).toBe('boolean');
  });

  it('returns undefined for unknown ISPB', () => {
    expect(getInstitutionByIspb('99999999')).toBeUndefined();
  });

  it('is equivalent to deprecated getInstitution', () => {
    expect(getInstitutionByIspb('60746948')).toEqual(getInstitution('60746948'));
  });

  it('does not fail for any explicit canonical ISPB', () => {
    const datasets = [SPI_PARTICIPANTS, PIX_ACTIVE_PARTICIPANTS, PIX_IN_ADHESION] as const;

    for (const dataset of datasets) {
      for (const ispb of explicitIspbs(dataset)) {
        expect(getInstitutionByIspb(ispb), `lookup failed for ${ispb}`).toBeDefined();
      }
    }
  });
});

describe('getSpiParticipantByIspb', () => {
  it('returns SpiParticipantRecord for known ISPB', () => {
    const record = getSpiParticipantByIspb('60746948');
    expect(record?.dataset).toBe('spi_participants');
    expect(record?.ispb).toBe('60746948');
  });

  it('returns undefined for unknown ISPB', () => {
    expect(getSpiParticipantByIspb('99999999')).toBeUndefined();
  });
});

describe('getPixActiveParticipantByIspb', () => {
  it('returns PixActiveParticipantRecord for known active Pix ISPB', () => {
    const record = getPixActiveParticipantByIspb('60746948');
    expect(record?.dataset).toBe('pix_active_participants');
    expect(record?.ispb).toBe('60746948');
  });

  it('returns undefined for unknown ISPB', () => {
    expect(getPixActiveParticipantByIspb('99999999')).toBeUndefined();
  });
});

describe('getInstitutionStatusByIspb', () => {
  it('returns InstitutionStatus for known ISPB', () => {
    const status = getInstitutionStatusByIspb('60746948');
    expect(typeof status?.inSpi).toBe('boolean');
    expect(typeof status?.inPixActive).toBe('boolean');
    expect(typeof status?.inPixAdhesion).toBe('boolean');
    expect(status?.matchConfidence).toBeDefined();
    expect(status?.canonicalSource).toContain('github.com');
  });

  it('returns undefined for unknown ISPB', () => {
    expect(getInstitutionStatusByIspb('99999999')).toBeUndefined();
  });

  it('does not conflate adhesion and active for Bradesco', () => {
    const status = getInstitutionStatusByIspb('60746948');
    expect(status?.inPixActive).toBe(true);
    expect(status?.inPixAdhesion).toBe(false);
  });

  it('marks canonical dataset presence consistently for explicit ISPBs', () => {
    for (const ispb of explicitIspbs(SPI_PARTICIPANTS)) {
      expect(getInstitutionStatusByIspb(ispb)?.inSpi, `SPI status failed for ${ispb}`).toBe(
        true
      );
    }
    for (const ispb of explicitIspbs(PIX_ACTIVE_PARTICIPANTS)) {
      expect(
        getInstitutionStatusByIspb(ispb)?.inPixActive,
        `Pix active status failed for ${ispb}`
      ).toBe(true);
    }
    for (const ispb of explicitIspbs(PIX_IN_ADHESION)) {
      expect(
        getInstitutionStatusByIspb(ispb)?.inPixAdhesion,
        `Pix adhesion status failed for ${ispb}`
      ).toBe(true);
    }
  });
});

describe('searchInstitutionsByName', () => {
  it('finds by partial name (case-insensitive)', () => {
    const results = searchInstitutionsByName('bradesco');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name.toLowerCase()).toContain('bradesco');
  });

  it('returns InstitutionEntry objects with the full set of fields', () => {
    const results = searchInstitutionsByName('itau');
    expect(results.length).toBeGreaterThan(0);
    expect(typeof results[0]?.inSpi).toBe('boolean');
    expect(typeof results[0]?.inPixActive).toBe('boolean');
    expect(typeof results[0]?.matchConfidence).toBe('string');
  });

  it('returns empty array for no match', () => {
    expect(searchInstitutionsByName('xyznotexistent12345')).toEqual([]);
  });

  it('is equivalent to deprecated searchInstitutions', () => {
    expect(searchInstitutionsByName('nubank')).toEqual(searchInstitutions('nubank'));
  });
});
