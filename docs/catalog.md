# Catálogo

O produto principal deste repositório é o ISPB Participants Catalog. O pacote `@cafeina_dev/ispb-participants` é o cliente oficial desse catálogo.

## Distribuição principal

- `current/` contém apenas o snapshot promovido mais recente e validado.
- `snapshots/YYYY-MM-DD/` preserva o histórico imutável de execuções bem-sucedidas.
- `datapackage.json` descreve os recursos publicados em `current/`.
- `schemas/` define os contratos dos quatro datasets.
- `src/catalog/` concentra a lógica canônica de domínio usada pelo pipeline e pelo runtime.
- `src/generated/current.ts` e `src/generated/metadata.ts` são gerados a partir de `current/` e embutidos no bundle publicado no npm.

## O que o catálogo redistribui

- CSV normalizado por dataset
- JSON por dataset
- `manifest.json` por snapshot
- schemas JSON versionados
- documentação estática

## O que o catálogo não faz

- Não altera a semântica oficial para forçar convergência entre datasets.
- Não substitui a consulta à fonte oficial quando o usuário precisa do original.
- Não promove `current/` quando há falha de coleta, parse ou validação.
