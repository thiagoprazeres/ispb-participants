import { parse as parseCsv } from 'csv-parse/sync';

import {
  PIX_MODE_CODE_MAP,
  PIX_SECTION_ACTIVE,
  PIX_SECTION_ADHESION,
  SPI_PARTICIPATION_CODE_MAP,
  schemaVersions,
} from './schemas.js';
import type {
  PixActiveParticipantRecord,
  PixInAdhesionRecord,
  ResolvedSource,
  SpiParticipantRecord,
} from './types.js';

type PixSectionRow = {
  row_number: string;
  nome_reduzido: string;
  ispb: string;
  cnpj: string;
  tipo_instituicao: string;
  autorizada_pelo_bcb: string;
  tipo_participacao_spi: string;
  tipo_participacao_pix: string;
  modalidade_participacao_pix: string;
  initiation_of_payment?: string;
  facilitator_of_withdrawal_and_change?: string;
  adhesion_status?: string;
};

export function normalizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const normalized = value.replace(/\u0000/g, '').trim();
  if (!normalized) return null;
  if (/^n\/a$/i.test(normalized)) return null;
  return normalized;
}

export function asciiFold(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeDigits(
  value: string | null | undefined,
  length?: number
): string | null {
  const digits = (value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  if (length) return digits.padStart(length, '0').slice(-length);
  return digits;
}

export function normalizeIspb(ispb: string): string {
  return String(ispb).trim().padStart(8, '0');
}

export function parsePtBoolean(value: string | null | undefined): boolean | null {
  const folded = asciiFold(value);
  if (!folded) return null;
  if (folded === 'sim') return true;
  if (folded === 'nao') return false;
  return null;
}

export function parsePublishedDate(value: string | null | undefined): string | null {
  const text = value ?? '';
  const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function extractDateFromUrl(value: string): string | null {
  const match = value.match(/(20\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function parseSemicolonCsvRows(text: string): Record<string, string>[] {
  return parseCsv(text, {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as Record<string, string>[];
}

export function splitPixCsvSections(text: string) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd());

  const activeTitleIndex = lines.findIndex(
    line => asciiFold(line) === asciiFold(PIX_SECTION_ACTIVE)
  );
  const adhesionTitleIndex = lines.findIndex(
    line => asciiFold(line) === asciiFold(PIX_SECTION_ADHESION)
  );

  if (activeTitleIndex === -1 || adhesionTitleIndex === -1) {
    throw new Error('The official Pix CSV does not expose both expected semantic sections.');
  }

  const activeHeader = lines[activeTitleIndex + 1];
  const adhesionHeader = lines[adhesionTitleIndex + 1];
  const activeRows = lines
    .slice(activeTitleIndex + 2, adhesionTitleIndex)
    .filter(line => line.trim().length > 0);
  const adhesionRows = lines
    .slice(adhesionTitleIndex + 2)
    .filter(line => line.trim().length > 0);

  if (!activeHeader || !adhesionHeader || activeRows.length === 0 || adhesionRows.length === 0) {
    throw new Error('The official Pix CSV is missing one of the expected tabular sections.');
  }

  return {
    activeTitle: lines[activeTitleIndex]!,
    activeHeader,
    activeRows,
    adhesionTitle: lines[adhesionTitleIndex]!,
    adhesionHeader,
    adhesionRows,
  };
}

function parsePixSection(
  headerLine: string,
  lines: string[],
  hasStatus: boolean
): PixSectionRow[] {
  const rows = parseCsv(`${headerLine}\n${lines.join('\n')}`, {
    delimiter: ';',
    columns: false,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as string[][];

  const dataRows = rows.slice(1);
  return dataRows.map(row => ({
    row_number: row[0] ?? '',
    nome_reduzido: row[1] ?? '',
    ispb: row[2] ?? '',
    cnpj: row[3] ?? '',
    tipo_instituicao: row[4] ?? '',
    autorizada_pelo_bcb: row[5] ?? '',
    tipo_participacao_spi: row[6] ?? '',
    tipo_participacao_pix: row[7] ?? '',
    modalidade_participacao_pix: row[8] ?? '',
    ...(hasStatus
      ? { adhesion_status: row[9] ?? '' }
      : {
          initiation_of_payment: row[9] ?? '',
          facilitator_of_withdrawal_and_change: row[10] ?? '',
        }),
  }));
}

export function parsePixCombinedCsv(text: string) {
  const sections = splitPixCsvSections(text);
  return {
    active: parsePixSection(sections.activeHeader, sections.activeRows, false),
    adhesion: parsePixSection(sections.adhesionHeader, sections.adhesionRows, true),
  };
}

export function normalizeSpiRecords(
  rows: Record<string, string>[],
  snapshotDate: string,
  source: ResolvedSource
): SpiParticipantRecord[] {
  return rows.map((row, index) => {
    const ispb = normalizeDigits(row.participante, 8);
    const cnpj = normalizeDigits(row.cnpj, 14);
    const sourceRecordId = `spi:${ispb ?? `row-${index + 1}`}`;
    const rawPixModeCode = normalizeText(row.modalidadeParticipacaoPix);
    const rawSpiCode = normalizeText(row.tipoParticipanteSpi);

    return {
      dataset: 'spi_participants',
      source_record_id: sourceRecordId,
      ispb,
      cnpj,
      institution_name: normalizeText(row.nomeParticipante),
      short_name: normalizeText(row.nomeReduzidoParticipante),
      institution_type: null,
      spi_participation_type: rawSpiCode
        ? SPI_PARTICIPATION_CODE_MAP[rawSpiCode] ?? rawSpiCode
        : null,
      pix_participation_type: null,
      pix_participation_mode: rawPixModeCode
        ? PIX_MODE_CODE_MAP[rawPixModeCode] ?? rawPixModeCode
        : null,
      is_authorized_by_bcb: null,
      catalog_snapshot_date: snapshotDate,
      source_registry_id: source.registry.id,
      source_file_url: source.csvUrl,
      source_publication_date: source.sourcePublicationDate,
      schema_version: schemaVersions.spi_participants,
      raw_source_json: JSON.stringify(row),
      raw_modalidade_participacao_pix_code: rawPixModeCode,
      raw_tipo_participante_spi_code: rawSpiCode,
      spi_started_at: normalizeText(row.dataHoraInicioOperacaoSpi),
    };
  });
}

function normalizePixBaseRecord(
  row: PixSectionRow,
  dataset: 'pix_active_participants' | 'pix_in_adhesion',
  snapshotDate: string,
  source: ResolvedSource
) {
  const rowNumber = normalizeDigits(row.row_number) ?? '0';
  const ispb = normalizeDigits(row.ispb, 8);

  return {
    dataset,
    source_record_id: `${dataset}:${rowNumber}`,
    ispb,
    cnpj: normalizeDigits(row.cnpj, 14),
    institution_name: normalizeText(row.nome_reduzido),
    short_name: normalizeText(row.nome_reduzido),
    institution_type: normalizeText(row.tipo_instituicao),
    spi_participation_type: normalizeText(row.tipo_participacao_spi),
    pix_participation_type: normalizeText(row.tipo_participacao_pix),
    pix_participation_mode: normalizeText(row.modalidade_participacao_pix),
    is_authorized_by_bcb: parsePtBoolean(row.autorizada_pelo_bcb),
    catalog_snapshot_date: snapshotDate,
    source_registry_id: source.registry.id,
    source_file_url: source.csvUrl,
    source_publication_date: source.sourcePublicationDate,
    raw_source_json: JSON.stringify(row),
  };
}

export function normalizePixActiveRecords(
  rows: PixSectionRow[],
  snapshotDate: string,
  source: ResolvedSource
): PixActiveParticipantRecord[] {
  return rows.map(row => ({
    ...normalizePixBaseRecord(row, 'pix_active_participants', snapshotDate, source),
    schema_version: schemaVersions.pix_active_participants,
    initiation_of_payment: parsePtBoolean(row.initiation_of_payment),
    facilitator_of_withdrawal_and_change: parsePtBoolean(
      row.facilitator_of_withdrawal_and_change
    ),
  }));
}

export function normalizePixInAdhesionRecords(
  rows: PixSectionRow[],
  snapshotDate: string,
  source: ResolvedSource
): PixInAdhesionRecord[] {
  return rows.map(row => ({
    ...normalizePixBaseRecord(row, 'pix_in_adhesion', snapshotDate, source),
    schema_version: schemaVersions.pix_in_adhesion,
    adhesion_status: normalizeText(row.adhesion_status),
  }));
}
