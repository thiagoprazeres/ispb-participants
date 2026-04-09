# Schemas

Os arquivos em `schemas/` usam JSON Schema Draft 2020-12 e versionam o contrato dos datasets canônicos.

## Arquivos

- `schemas/spi_participants.schema.json`
- `schemas/pix_active_participants.schema.json`
- `schemas/pix_in_adhesion.schema.json`
- `schemas/catalog_crosswalk.schema.json`

## Estratégia de versionamento

- Cada registro carrega `schema_version`.
- Mudanças compatíveis podem adicionar campos opcionais ou preservar novos campos oficiais em `raw_source_json`.
- Remoção, renomeação ou quebra de um campo obrigatório upstream bloqueia a promoção de `current/`.

## Tolerância a mudanças upstream

- Novas colunas oficiais entram primeiro em `raw_source_json`.
- A normalização só promove campos para o contrato canônico quando a semântica fica suficientemente clara.
- Divergências entre datasets são registradas, não escondidas.
