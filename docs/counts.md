# Contagens e Escopo

Use `current/manifest.json` como fonte de verdade para contagens públicas.

## Qual contagem usar

- Para comparação de SPI: use `record_counts.spi_participants`.
- Para comparação de Pix ativo: use `record_counts.pix_active_participants`.
- Para adesão ao Pix: use `record_counts.pix_in_adhesion`.
- Para linhas da camada derivada de ligação: use `record_counts.catalog_crosswalk`.

## Por que não existe um único total do catálogo

O catálogo é multi-dataset. `spi_participants`, `pix_active_participants`, `pix_in_adhesion` e `catalog_crosswalk` têm escopos diferentes e não podem ser colapsados em uma única manchete numérica sem perder semântica.

No snapshot atual, `910` vale apenas para `pix_active_participants`. Não é o tamanho genérico do catálogo.
