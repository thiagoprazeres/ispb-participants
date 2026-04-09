# Escopo Semântico

## As três fontes são distintas e assim devem permanecer

O catálogo separa três visões que **não são equivalentes**:

| Dataset | O que representa |
|---|---|
| `spi_participants` | Participantes do SPI segundo a publicação oficial do SPI |
| `pix_active_participants` | Participantes **ativos** do Pix segundo a publicação oficial do Pix |
| `pix_in_adhesion` | Instituições em **processo de adesão** ao Pix |

Uma instituição pode aparecer em qualquer combinação dessas três fontes, com diferenças de nome, CNPJ ou campos específicos. O catálogo **não resolve essas diferenças silenciosamente**.

## Regra central

- O catálogo nunca promove um registro de adesão para participante ativo.
- O catálogo nunca converte automaticamente diferenças entre SPI e Pix.
- O catálogo nunca inventa equivalências sem documentar o critério e o grau de confiança.

## O que é `INSTITUTIONS`

`INSTITUTIONS` é o **índice derivado oficial e lookup-safe por ISPB** gerado pelo pacote npm. Ele agrega os três datasets por ISPB para lookup e busca. **Não é um dataset canônico.**

O contrato dessa camada é restrito e explícito: se um ISPB aparece de forma explícita em qualquer dataset canônico, o lookup por ISPB no pacote deve encontrar uma entrada correspondente em `INSTITUTIONS`.

Para deixar claro o grau de certeza de cada entrada, todo `InstitutionEntry` carrega:

- `inSpi` — se veio de `spi_participants`
- `inPixActive` — se veio de `pix_active_participants`
- `inPixAdhesion` — se veio de `pix_in_adhesion`
- `matchConfidence` — confiança do agrupamento
- `sourceDatasets` — lista exata dos datasets que contribuíram

**Nunca oculte `matchConfidence` do usuário final.** Se a confiança não é `exact_ispb`, o agrupamento é conservador.

## Critérios de `matchConfidence`

| Valor | Quando ocorre |
|---|---|
| `exact_ispb` | Registro tem ISPB explícito — match determinístico |
| `unique_cnpj` | Sem ISPB; CNPJ único entre registros sem ISPB e sem conflito com registro com ISPB |
| `no_auto_match` | CNPJ ambíguo ou ausente — sem agrupamento automático |
| `derived` | Entrada gerada pelo índice a partir de registro sem ISPB identificável |

## Critérios do `catalog_crosswalk`

- `catalog_entity_id = ispb:<ispb>` quando há ISPB
- `catalog_entity_id = cnpj:<cnpj>` apenas quando CNPJ é único entre registros sem ISPB e não conflita com registro com ISPB
- Em conflito: `match_method = no_auto_match`

## Como interpretar um registro de INSTITUTIONS

```
inst.inSpi = true       → aparece em spi_participants
inst.inPixActive = true → aparece em pix_active_participants (está ativo)
inst.inPixAdhesion = false → NÃO está em pix_in_adhesion
inst.matchConfidence = 'exact_ispb' → agrupamento determinístico por ISPB
```

Se `inPixActive = false` e `inPixAdhesion = true`: a instituição **está em processo de adesão, não é participante ativo do Pix**. Não apresente isso como "participa do Pix".
