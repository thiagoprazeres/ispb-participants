# Datasets

## Datasets canônicos (quatro)

Os quatro datasets abaixo são os artefatos canônicos do catálogo. Cada um preserva a semântica e a proveniência da fonte original. **Não devem ser colapsados silenciosamente.**

### `spi_participants`

Dataset derivado da publicação oficial pública do SPI. Contém ISPB, CNPJ, nome da instituição, nome reduzido, tipo de participação no SPI e modalidade Pix publicada na origem SPI.

Campos específicos: `spi_participation_type`, `pix_participation_mode`, `spi_started_at`, `raw_tipo_participante_spi_code`.

### `pix_active_participants`

Dataset derivado da publicação oficial de participantes **ativos** do Pix. Preserva tipo de instituição, autorização pelo BCB, tipo de participação no SPI e no Pix, modalidade de participação, e as marcações `initiation_of_payment` e `facilitator_of_withdrawal_and_change`.

**Uma instituição neste dataset está ativa no Pix. Não confundir com adesão.**

### `pix_in_adhesion`

Dataset derivado da publicação oficial de instituições em **processo de adesão** ao Pix. Existe de forma separada para impedir que a camada derivada trate adesão como participação ativa.

Campo específico: `adhesion_status`.

### `catalog_crosswalk`

Camada derivada conservadora de ligação entre os três datasets de origem. Cada linha aponta para um registro de origem e informa o método de matching:

| `match_method` | Significado |
|---|---|
| `exact_ispb` | Unificação por ISPB exato — match seguro |
| `unique_cnpj` | Unificação por CNPJ único entre registros sem ISPB, sem conflito |
| `no_auto_match` | Sem unificação automática — CNPJ ambíguo ou ausente |

O crosswalk é útil para navegação e auditoria, mas **não deve ser usado para colapsar as três fontes em uma lista comercial única**.

---

## INSTITUTIONS — índice derivado de conveniência

`INSTITUTIONS` (export do pacote npm) é um índice agregado derivado dos três datasets canônicos de origem. **Não é um dataset canônico.**

Cada entrada em `INSTITUTIONS` preserva os marcadores explícitos de origem:

| Campo | Tipo | Significado |
|---|---|---|
| `inSpi` | `boolean` | A instituição está em `spi_participants` |
| `inPixActive` | `boolean` | A instituição está em `pix_active_participants` |
| `inPixAdhesion` | `boolean` | A instituição está em `pix_in_adhesion` |
| `matchConfidence` | `MatchConfidence` | Confiança do matching no crosswalk |
| `sourceDatasets` | `SourceDatasetName[]` | Datasets de origem que contribuíram |
| `canonicalSource` | `string` | URL da pasta `current/` do catálogo |

Esses marcadores nunca devem ser ocultados. Se `inPixActive` é `false` e `inPixAdhesion` é `true`, a instituição está em processo de adesão — **não é participante ativo**.

---

## Artefatos disponíveis

Os datasets canônicos estão disponíveis em dois formatos em `current/`:

| Dataset | CSV | JSON |
|---|---|---|
| `spi_participants` | `current/spi_participants.csv` | `current/spi_participants.json` |
| `pix_active_participants` | `current/pix_active_participants.csv` | `current/pix_active_participants.json` |
| `pix_in_adhesion` | `current/pix_in_adhesion.csv` | `current/pix_in_adhesion.json` |
| `catalog_crosswalk` | `current/catalog_crosswalk.csv` | `current/catalog_crosswalk.json` |

Cada dataset tem um JSON Schema correspondente em `schemas/`.
