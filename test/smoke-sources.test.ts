import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { resolveOfficialSources } from '../src/catalog/loaders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

describe('official source resolution smoke test', () => {
  it(
    'resolves live official Banco Central sources for SPI and Pix',
    async () => {
      const sources = await resolveOfficialSources(repoRoot);

      expect(sources.spi_participants.csvUrl).toContain('bcb.gov.br/content/estabilidadefinanceira/spi/');
      expect(sources.spi_participants.pdfUrl).toContain('bcb.gov.br/content/estabilidadefinanceira/spi-pdf/');
      expect(sources.pix_active_participants.csvUrl).toContain(
        'bcb.gov.br/content/estabilidadefinanceira/participantes_pix/'
      );
      expect(sources.pix_in_adhesion.csvUrl).toBe(sources.pix_active_participants.csvUrl);
      expect(sources.spi_participants.sourcePublicationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(sources.pix_active_participants.sourcePublicationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    },
    120000
  );
});
