// AUTO-GENERATED - do not edit manually.
// Source: ISPB Participants Catalog
// To regenerate: npm run generate

import type { CatalogMetadata, Metadata } from '../catalog/types.js';

export const METADATA: Metadata = {
  "source": "ISPB Participants Catalog current snapshot",
  "sourceUrl": "https://github.com/thiagoprazeres/ispb-participants/tree/main/current",
  "snapshotDate": "2026-04-14",
  "spiParticipantCount": 893,
  "pixActiveParticipantCount": 912,
  "pixInAdhesionCount": 18,
  "crosswalkRecordCount": 1823,
  "sourceDate": "2026-04-14",
  "recordCount": 912
} as const;

export const CATALOG_METADATA: CatalogMetadata = {
  "catalogUrl": "https://github.com/thiagoprazeres/ispb-participants",
  "snapshotDate": "2026-04-14",
  "spiParticipantCount": 893,
  "pixActiveParticipantCount": 912,
  "pixInAdhesionCount": 18,
  "crosswalkRecordCount": 1823,
  "manifest": {
    "snapshot_date": "2026-04-14",
    "collected_at": "2026-04-14T10:40:56.937Z",
    "source_urls": {
      "spi_participants": [
        "https://www.bcb.gov.br/estabilidadefinanceira/sistemapagamentosinstantaneos",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/sistemapagamentosinstantaneos",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/spi-pdf/participantes-spi-20260414.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/spi/participantes-spi-20260414.csv"
      ],
      "pix_active_participants": [
        "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260414.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260414.csv"
      ],
      "pix_in_adhesion": [
        "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260414.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260414.csv"
      ],
      "catalog_crosswalk": [
        "https://www.bcb.gov.br/estabilidadefinanceira/sistemapagamentosinstantaneos",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/sistemapagamentosinstantaneos",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/spi-pdf/participantes-spi-20260414.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/spi/participantes-spi-20260414.csv",
        "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260414.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260414.csv",
        "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260414.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260414.csv"
      ]
    },
    "source_publication_dates": {
      "spi_participants": "2026-04-14",
      "pix_active_participants": "2026-04-14",
      "pix_in_adhesion": "2026-04-14",
      "catalog_crosswalk": null
    },
    "dataset_hashes": {
      "spi_participants": {
        "csv_sha256": "589e4d4352d005b0402e9e91ef1f0d27a03375a03d4aedd42941bbc672b2b197",
        "json_sha256": "8f8cb7849aaee309512fe38daeb250069aaf539b6908db9cb085bec1f39e4ec3"
      },
      "pix_active_participants": {
        "csv_sha256": "f77545cf2782cb41d4bef4eb3aa77a641618a791fb76fd64f894db713c475d39",
        "json_sha256": "3f40e76da2889f7a284135ee582ad1bcdb1197d18998467ece36e74d01619702"
      },
      "pix_in_adhesion": {
        "csv_sha256": "6b63be7ac9aea086fa78145ce17008a7cf35b1301c4a0cf36ae70801bb05252e",
        "json_sha256": "279fa1c95db1ead56666a248781459eb0b9461475f8512d1fab7107ee73d24a1"
      },
      "catalog_crosswalk": {
        "csv_sha256": "0fb979cf067eed1d6ace3e2475ce6a6511825f778f441d7042c57acf9a7a6674",
        "json_sha256": "99ce082339977dc5107666d11df1a8ba916ba47c58993f0ec221ecd614ccea60"
      }
    },
    "record_counts": {
      "spi_participants": 893,
      "pix_active_participants": 912,
      "pix_in_adhesion": 18,
      "catalog_crosswalk": 1823
    },
    "schema_versions": {
      "spi_participants": "1.0.0",
      "pix_active_participants": "1.0.0",
      "pix_in_adhesion": "1.0.0",
      "catalog_crosswalk": "1.0.0"
    },
    "pipeline_version": "2026.04.09",
    "validation_status": {
      "status": "passed",
      "checks": [
        "schema:spi_participants",
        "schema:pix_active_participants",
        "schema:pix_in_adhesion",
        "schema:catalog_crosswalk",
        "crosswalk:one-row-per-source-record",
        "integrity:row-counts"
      ]
    },
    "warnings": [
      {
        "severity": "warning",
        "dataset": "catalog_crosswalk",
        "stage": "semantic",
        "message": "No-ISPB CNPJ 13776742000155 was kept conservative in the crosswalk because it is ambiguous or conflicts with an ISPB-bearing record."
      }
    ],
    "errors": []
  },
  "sources": {
    "spi_participants": [
      "https://www.bcb.gov.br/estabilidadefinanceira/sistemapagamentosinstantaneos",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/sistemapagamentosinstantaneos",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/spi-pdf/participantes-spi-20260414.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/spi/participantes-spi-20260414.csv"
    ],
    "pix_active_participants": [
      "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260414.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260414.csv"
    ],
    "pix_in_adhesion": [
      "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260414.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260414.csv"
    ],
    "catalog_crosswalk": [
      "https://www.bcb.gov.br/estabilidadefinanceira/sistemapagamentosinstantaneos",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/sistemapagamentosinstantaneos",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/spi-pdf/participantes-spi-20260414.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/spi/participantes-spi-20260414.csv",
      "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260414.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260414.csv",
      "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260414.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260414.csv"
    ]
  }
} as const;
