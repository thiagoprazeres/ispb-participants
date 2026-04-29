// AUTO-GENERATED - do not edit manually.
// Source: ISPB Participants Catalog
// To regenerate: npm run generate

import type { CatalogMetadata, Metadata } from '../catalog/types.js';

export const METADATA: Metadata = {
  "source": "ISPB Participants Catalog current snapshot",
  "sourceUrl": "https://github.com/thiagoprazeres/ispb-participants/tree/main/current",
  "snapshotDate": "2026-04-29",
  "spiParticipantCount": 895,
  "pixActiveParticipantCount": 914,
  "pixInAdhesionCount": 14,
  "crosswalkRecordCount": 1823,
  "sourceDate": "2026-04-29",
  "recordCount": 914
} as const;

export const CATALOG_METADATA: CatalogMetadata = {
  "catalogUrl": "https://github.com/thiagoprazeres/ispb-participants",
  "snapshotDate": "2026-04-29",
  "spiParticipantCount": 895,
  "pixActiveParticipantCount": 914,
  "pixInAdhesionCount": 14,
  "crosswalkRecordCount": 1823,
  "manifest": {
    "snapshot_date": "2026-04-29",
    "collected_at": "2026-04-29T11:05:13.061Z",
    "source_urls": {
      "spi_participants": [
        "https://www.bcb.gov.br/estabilidadefinanceira/sistemapagamentosinstantaneos",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/sistemapagamentosinstantaneos",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/spi-pdf/participantes-spi-20260429.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/spi/participantes-spi-20260429.csv"
      ],
      "pix_active_participants": [
        "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260429.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260429.csv"
      ],
      "pix_in_adhesion": [
        "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260429.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260429.csv"
      ],
      "catalog_crosswalk": [
        "https://www.bcb.gov.br/estabilidadefinanceira/sistemapagamentosinstantaneos",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/sistemapagamentosinstantaneos",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/spi-pdf/participantes-spi-20260429.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/spi/participantes-spi-20260429.csv",
        "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260429.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260429.csv",
        "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260429.pdf",
        "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260429.csv"
      ]
    },
    "source_publication_dates": {
      "spi_participants": "2026-04-29",
      "pix_active_participants": "2026-04-29",
      "pix_in_adhesion": "2026-04-29",
      "catalog_crosswalk": null
    },
    "dataset_hashes": {
      "spi_participants": {
        "csv_sha256": "d5ee0dd8ac765051dc89d48f05ed42a3b42a51e85971beeee4c9adab920bd8b4",
        "json_sha256": "4367b63c5cf86a29c508cbf651d0dbd3cf78bb6dc9e2c8da0098aab1824e2e42"
      },
      "pix_active_participants": {
        "csv_sha256": "7aea8d00d173d8050ceca3917105268c303c2cae44f894256090380cf94c4786",
        "json_sha256": "4c238eb7b8b9ff3a2945335911a6f45f1840fd1825613d4e95e62ae8ac51d9dd"
      },
      "pix_in_adhesion": {
        "csv_sha256": "0ab872590a62b89bdf894932c329be75fc87157e247b48baead8d6dde11a993e",
        "json_sha256": "d65fc4372f2d74172292bacc78291e815caa4f393760068405330f9d68ecb9d6"
      },
      "catalog_crosswalk": {
        "csv_sha256": "cd330d09c4a79f62fa0ef6554457bcc39d4c9c04911b30cc66ffd717a9276807",
        "json_sha256": "be90f7e0b616db5c995864e167931cc22c042ee6143d8da426359c2df47905e4"
      }
    },
    "record_counts": {
      "spi_participants": 895,
      "pix_active_participants": 914,
      "pix_in_adhesion": 14,
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
      "https://www.bcb.gov.br/content/estabilidadefinanceira/spi-pdf/participantes-spi-20260429.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/spi/participantes-spi-20260429.csv"
    ],
    "pix_active_participants": [
      "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260429.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260429.csv"
    ],
    "pix_in_adhesion": [
      "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260429.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260429.csv"
    ],
    "catalog_crosswalk": [
      "https://www.bcb.gov.br/estabilidadefinanceira/sistemapagamentosinstantaneos",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/sistemapagamentosinstantaneos",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/spi-pdf/participantes-spi-20260429.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/spi/participantes-spi-20260429.csv",
      "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260429.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260429.csv",
      "https://www.bcb.gov.br/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/api/paginasite/sitebcb/estabilidadefinanceira/pix-participantes",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix_pdf/lista-participantes-instituicoes-em-adesao-pix-20260429.pdf",
      "https://www.bcb.gov.br/content/estabilidadefinanceira/participantes_pix/lista-participantes-instituicoes-em-adesao-pix-20260429.csv"
    ]
  }
} as const;
