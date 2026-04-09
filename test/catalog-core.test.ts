import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { buildCrosswalk } from '../src/catalog/crosswalk.js';
import {
  buildDatasetArtifacts,
  buildManifest,
  buildPackageProjection,
  buildSha256,
} from '../src/catalog/metadata.js';
import {
  normalizeDigits,
  normalizePixActiveRecords,
  normalizePixInAdhesionRecords,
  normalizeSpiRecords,
  parsePixCombinedCsv,
} from '../src/catalog/normalize.js';
import { validateRepositoryState } from '../src/catalog/validate.js';
import type {
  CatalogBuildResult,
  ResolvedSource,
  ValidationSummary,
} from '../src/catalog/types.js';
import { generateArtifactsStage } from '../scripts/generate-artifacts.js';
import { promoteCurrentStage } from '../scripts/promote-current.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(dir =>
      import('node:fs/promises').then(({ rm }) => rm(dir, { force: true, recursive: true }))
    )
  );
});

function createResolvedSource(
  dataset: 'spi_participants' | 'pix_active_participants' | 'pix_in_adhesion',
  id: string,
  csvUrl: string,
  publicationDate: string
): ResolvedSource {
  return {
    registry: {
      id,
      dataset,
      official_page_url: `https://www.bcb.gov.br/${dataset}`,
      official_page_api_url: `https://www.bcb.gov.br/api/${dataset}`,
      content_identifier: `${dataset}-pdf`,
      expected_title_pattern: dataset,
      preferred_format: 'csv',
      accepted_fallback_formats: ['pdf'],
      notes: 'fixture',
      license_notice: 'fixture',
    },
    officialPageUrl: `https://www.bcb.gov.br/${dataset}`,
    officialPageApiUrl: `https://www.bcb.gov.br/api/${dataset}`,
    pdfUrl: csvUrl.replace('.csv', '.pdf'),
    csvUrl,
    pdfTitle: `${dataset} fixture`,
    sourcePublicationDate: publicationDate,
  };
}

describe('catalog core helpers', () => {
  it('normalizes digit-only identifiers conservatively', () => {
    expect(normalizeDigits('12.345.678/0001-90', 14)).toBe('12345678000190');
    expect(normalizeDigits('12345', 8)).toBe('00012345');
    expect(normalizeDigits('', 8)).toBeNull();
  });

  it('splits and parses the official Pix combined CSV structure', () => {
    const csv = [
      'Lista de participantes ativos do Pix',
      'N;Nome Reduzido;ISPB;CNPJ;Tipo de Instituicao;Autorizada pelo BCB;Tipo de Participacao no SPI;Tipo de Participacao no Pix;Modalidade de Participacao;Iniciador de Transacao de Pagamento;Facilitador de Saque e Troco',
      '1;Banco Teste;12345678;12345678000190;Banco Comercial;Sim;Direta;Participante Direto;Conta Transacional;Sim;Nao',
      'Lista de instituicoes em processo de adesao ao Pix',
      'N;Nome Reduzido;ISPB;CNPJ;Tipo de Instituicao;Autorizada pelo BCB;Tipo de Participacao no SPI;Tipo de Participacao no Pix;Modalidade de Participacao;Status',
      '1;Instituicao em Adesao;;99887766000155;Instituicao de Pagamento;Nao;Indireta;Participante Indireto;Conta Transacional;Em adesao',
    ].join('\n');

    const sections = parsePixCombinedCsv(csv);
    expect(sections.active).toHaveLength(1);
    expect(sections.adhesion).toHaveLength(1);
    expect(sections.active[0]?.ispb).toBe('12345678');
    expect(sections.adhesion[0]?.adhesion_status).toBe('Em adesao');
  });

  it('normalizes datasets, builds a conservative crosswalk and projects the package view', () => {
    const snapshotDate = '2026-04-09';
    const publicationDate = '2026-04-08';
    const spiSource = createResolvedSource(
      'spi_participants',
      'bcb-spi-participants',
      'https://www.bcb.gov.br/content/estabilidadefinanceira/spi/participantes-spi-20260408.csv',
      publicationDate
    );
    const pixSource = createResolvedSource(
      'pix_active_participants',
      'bcb-pix-active-participants',
      'https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-20260408.csv',
      publicationDate
    );
    const pixAdhesionSource = createResolvedSource(
      'pix_in_adhesion',
      'bcb-pix-in-adhesion',
      'https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-20260408.csv',
      publicationDate
    );

    const spi = normalizeSpiRecords(
      [
        {
          participante: '12345678',
          cnpj: '12.345.678/0001-90',
          nomeParticipante: 'Banco Teste S.A.',
          nomeReduzidoParticipante: 'Banco Teste',
          modalidadeParticipacaoPix: 'PDCT',
          tipoParticipanteSpi: 'DRCT',
          dataHoraInicioOperacaoSpi: '2026-04-08T10:00:00Z',
        },
      ],
      snapshotDate,
      spiSource
    );

    const pixActive = normalizePixActiveRecords(
      [
        {
          row_number: '1',
          nome_reduzido: 'Banco Teste',
          ispb: '12345678',
          cnpj: '12345678000190',
          tipo_instituicao: 'Banco Comercial',
          autorizada_pelo_bcb: 'Sim',
          tipo_participacao_spi: 'Direta',
          tipo_participacao_pix: 'Participante Direto',
          modalidade_participacao_pix: 'Conta Transacional',
          initiation_of_payment: 'Sim',
          facilitator_of_withdrawal_and_change: 'Nao',
        },
      ],
      snapshotDate,
      pixSource
    );

    const pixInAdhesion = normalizePixInAdhesionRecords(
      [
        {
          row_number: '1',
          nome_reduzido: 'Adesao Unica',
          ispb: '',
          cnpj: '99887766000155',
          tipo_instituicao: 'Instituicao de Pagamento',
          autorizada_pelo_bcb: 'Nao',
          tipo_participacao_spi: 'Indireta',
          tipo_participacao_pix: 'Participante Indireto',
          modalidade_participacao_pix: 'Conta Transacional',
          adhesion_status: 'Em adesao',
        },
        {
          row_number: '2',
          nome_reduzido: 'Sem Match',
          ispb: '',
          cnpj: '',
          tipo_instituicao: 'Instituicao de Pagamento',
          autorizada_pelo_bcb: 'Nao',
          tipo_participacao_spi: 'Indireta',
          tipo_participacao_pix: 'Participante Indireto',
          modalidade_participacao_pix: 'Conta Transacional',
          adhesion_status: 'Em adesao',
        },
      ],
      snapshotDate,
      pixAdhesionSource
    );

    const crosswalk = buildCrosswalk(snapshotDate, {
      spi,
      pixActive,
      pixInAdhesion,
    });

    const artifacts = {
      spi_participants: buildDatasetArtifacts('spi_participants', spi),
      pix_active_participants: buildDatasetArtifacts('pix_active_participants', pixActive),
      pix_in_adhesion: buildDatasetArtifacts('pix_in_adhesion', pixInAdhesion),
      catalog_crosswalk: buildDatasetArtifacts('catalog_crosswalk', crosswalk.records),
    };
    const validation: ValidationSummary = {
      ok: true,
      warnings: crosswalk.warnings,
      errors: [],
      checks: ['fixture'],
    };
    const manifest = buildManifest(
      snapshotDate,
      '2026-04-09T09:20:00.000Z',
      {
        spi_participants: spiSource,
        pix_active_participants: pixSource,
        pix_in_adhesion: pixAdhesionSource,
      },
      artifacts,
      validation
    );
    const projection = buildPackageProjection(
      {
        spi_participants: spi,
        pix_active_participants: pixActive,
        pix_in_adhesion: pixInAdhesion,
        catalog_crosswalk: crosswalk.records,
      },
      manifest
    );

    expect(spi[0]?.pix_participation_mode).toBe('Provedor de Conta Transacional');
    expect(pixActive[0]?.initiation_of_payment).toBe(true);
    expect(pixInAdhesion[0]?.adhesion_status).toBe('Em adesao');
    expect(
      crosswalk.records.find(record => record.source_record_id === 'spi:12345678')?.match_method
    ).toBe('exact_ispb');
    expect(
      crosswalk.records.find(record => record.source_record_id === 'pix_in_adhesion:1')
        ?.match_method
    ).toBe('unique_cnpj');
    expect(
      crosswalk.records.find(record => record.source_record_id === 'pix_in_adhesion:2')
        ?.match_method
    ).toBe('no_auto_match');
    expect(projection.institutions['12345678']?.sourceDatasets).toEqual([
      'spi_participants',
      'pix_active_participants',
    ]);
    expect(projection.institutions['12345678']?.authorizedByBcb).toBe(true);
    expect(projection.institutions['99887766']).toBeUndefined();
    expect(manifest.dataset_hashes.spi_participants.csv_sha256).toBe(
      buildSha256(artifacts.spi_participants.csv)
    );
  });
});

describe('promotion flow', () => {
  it('promotes current, regenerates package files and keeps repository validation green', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'ispb-catalog-fixture-'));
    tempDirs.push(repoRoot);
    await mkdir(path.join(repoRoot, 'src'), { recursive: true });
    await mkdir(path.join(repoRoot, 'docs'), { recursive: true });
    await mkdir(path.join(repoRoot, 'snapshots'), { recursive: true });

    const snapshotDate = '2026-04-09';
    const publicationDate = '2026-04-08';
    const sources = {
      spi_participants: createResolvedSource(
        'spi_participants',
        'bcb-spi-participants',
        'https://www.bcb.gov.br/content/estabilidadefinanceira/spi/participantes-spi-20260408.csv',
        publicationDate
      ),
      pix_active_participants: createResolvedSource(
        'pix_active_participants',
        'bcb-pix-active-participants',
        'https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-20260408.csv',
        publicationDate
      ),
      pix_in_adhesion: createResolvedSource(
        'pix_in_adhesion',
        'bcb-pix-in-adhesion',
        'https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-20260408.csv',
        publicationDate
      ),
    } as const;

    const spiRecords = normalizeSpiRecords(
      [
        {
          participante: '12345678',
          cnpj: '12.345.678/0001-90',
          nomeParticipante: 'Banco Teste S.A.',
          nomeReduzidoParticipante: 'Banco Teste',
          modalidadeParticipacaoPix: 'PDCT',
          tipoParticipanteSpi: 'DRCT',
          dataHoraInicioOperacaoSpi: '2026-04-08T10:00:00Z',
        },
      ],
      snapshotDate,
      sources.spi_participants
    );
    const pixActiveRecords = normalizePixActiveRecords(
      [
        {
          row_number: '1',
          nome_reduzido: 'Banco Teste',
          ispb: '12345678',
          cnpj: '12345678000190',
          tipo_instituicao: 'Banco Comercial',
          autorizada_pelo_bcb: 'Sim',
          tipo_participacao_spi: 'Direta',
          tipo_participacao_pix: 'Participante Direto',
          modalidade_participacao_pix: 'Conta Transacional',
          initiation_of_payment: 'Sim',
          facilitator_of_withdrawal_and_change: 'Nao',
        },
      ],
      snapshotDate,
      sources.pix_active_participants
    );
    const pixInAdhesionRecords = normalizePixInAdhesionRecords(
      [
        {
          row_number: '1',
          nome_reduzido: 'Adesao Unica',
          ispb: '',
          cnpj: '99887766000155',
          tipo_instituicao: 'Instituicao de Pagamento',
          autorizada_pelo_bcb: 'Nao',
          tipo_participacao_spi: 'Indireta',
          tipo_participacao_pix: 'Participante Indireto',
          modalidade_participacao_pix: 'Conta Transacional',
          adhesion_status: 'Em adesao',
        },
      ],
      snapshotDate,
      sources.pix_in_adhesion
    );
    const crosswalk = buildCrosswalk(snapshotDate, {
      spi: spiRecords,
      pixActive: pixActiveRecords,
      pixInAdhesion: pixInAdhesionRecords,
    });

    const artifacts = {
      spi_participants: buildDatasetArtifacts('spi_participants', spiRecords),
      pix_active_participants: buildDatasetArtifacts(
        'pix_active_participants',
        pixActiveRecords
      ),
      pix_in_adhesion: buildDatasetArtifacts('pix_in_adhesion', pixInAdhesionRecords),
      catalog_crosswalk: buildDatasetArtifacts('catalog_crosswalk', crosswalk.records),
    };
    const validation: ValidationSummary = {
      ok: true,
      warnings: crosswalk.warnings,
      errors: [],
      checks: ['fixture'],
    };
    const manifest = buildManifest(
      snapshotDate,
      '2026-04-09T09:20:00.000Z',
      sources,
      artifacts,
      validation
    );
    const result: CatalogBuildResult = {
      snapshotDate,
      collectedAt: manifest.collected_at,
      sources,
      datasets: {
        spi_participants: spiRecords,
        pix_active_participants: pixActiveRecords,
        pix_in_adhesion: pixInAdhesionRecords,
        catalog_crosswalk: crosswalk.records,
      },
      artifacts,
      validation,
      manifest,
    };

    await promoteCurrentStage(repoRoot, result);
    await generateArtifactsStage(repoRoot);

    expect(await stat(path.join(repoRoot, 'current', 'manifest.json'))).toBeTruthy();
    expect(await stat(path.join(repoRoot, 'snapshots', snapshotDate, 'manifest.json'))).toBeTruthy();
    expect(await stat(path.join(repoRoot, 'src', 'generated', 'current.ts'))).toBeTruthy();
    expect(await stat(path.join(repoRoot, 'src', 'generated', 'metadata.ts'))).toBeTruthy();

    const promotedManifest = JSON.parse(
      await readFile(path.join(repoRoot, 'current', 'manifest.json'), 'utf8')
    );
    expect(promotedManifest.record_counts.catalog_crosswalk).toBe(3);

    const generatedCurrent = await readFile(
      path.join(repoRoot, 'src', 'generated', 'current.ts'),
      'utf8'
    );
    expect(generatedCurrent).toContain('sourceDatasets');

    const repositoryValidation = await validateRepositoryState(repoRoot);
    expect(repositoryValidation.ok).toBe(true);
  });

  it('does not touch current when validation has already failed', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'ispb-catalog-failure-'));
    tempDirs.push(repoRoot);
    await mkdir(path.join(repoRoot, 'current'), { recursive: true });
    await writeFile(path.join(repoRoot, 'current', 'sentinel.txt'), 'keep me', 'utf8');

    await expect(
      promoteCurrentStage(repoRoot, {
        snapshotDate: '2026-04-09',
        collectedAt: '2026-04-09T09:20:00.000Z',
        sources: {} as CatalogBuildResult['sources'],
        datasets: {} as CatalogBuildResult['datasets'],
        artifacts: {} as CatalogBuildResult['artifacts'],
        validation: {
          ok: false,
          warnings: [],
          errors: [{ severity: 'error', dataset: 'catalog', message: 'fixture failure' }],
          checks: [],
        },
        manifest: {} as CatalogBuildResult['manifest'],
      })
    ).rejects.toThrow(/fixture failure/);

    const sentinel = await readFile(path.join(repoRoot, 'current', 'sentinel.txt'), 'utf8');
    expect(sentinel).toBe('keep me');
  });
});
