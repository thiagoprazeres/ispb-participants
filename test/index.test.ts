import { describe, it, expect } from 'vitest';
import {
  INSTITUTIONS,
  getCatalogMetadata,
  getInstitution,
  hasIspb,
  searchInstitutions,
  getMetadata,
} from '../src/index.js';

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
    expect(meta.sourceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(meta.recordCount).toBeGreaterThan(0);
  });
});

describe('getCatalogMetadata', () => {
  it('returns promoted catalog metadata', () => {
    const metadata = getCatalogMetadata();
    expect(metadata.catalogUrl).toContain('thiagoprazeres/ispb-participants');
    expect(metadata.snapshotDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(metadata.manifest.snapshot_date).toBe(metadata.snapshotDate);
    expect(metadata.manifest.validation_status.status).toBe('passed');
    expect(metadata.sources.spi_participants.some(url => url.includes('bcb.gov.br'))).toBe(true);
  });
});
