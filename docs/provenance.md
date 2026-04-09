# Proveniência

O catálogo usa apenas fontes públicas oficiais do Banco Central do Brasil.

## Registro de fontes

`sources/registry.json` cadastra, para cada dataset de origem:

- identificador da fonte
- URL da página oficial
- URL da API oficial da página
- identificador editorial
- padrão de título esperado
- formato preferido
- formatos de fallback aceitos

## Manifesto por snapshot

Cada snapshot gera `manifest.json` com:

- data do snapshot
- data e hora de coleta
- URLs oficiais utilizadas
- datas de publicação quando disponíveis
- hashes por dataset e por formato
- contagens de registros
- versões de schema
- versão da pipeline
- status de validação
- warnings e errors

## Proveniência por registro

Cada linha derivada preserva:

- `source_registry_id`
- `source_file_url`
- `source_publication_date`
- `catalog_snapshot_date`
- `raw_source_json`
