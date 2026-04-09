# ISPB Participants Catalog

_Catálogo público derivado de fonte oficial do Banco Central_

[![npm](https://img.shields.io/npm/v/@thiagoprazeres/ispb-participants)](https://www.npmjs.com/package/@thiagoprazeres/ispb-participants)
[![license code](https://img.shields.io/badge/code-MIT-blue)](./LICENSE)
[![license data](https://img.shields.io/badge/data-ODC--By%201.0-0b7285)](./LICENSE_DATA)

O ISPB Participants Catalog é um catálogo público derivado de fonte oficial do Banco Central do Brasil para participantes do SPI e do Pix. O projeto coleta, valida, normaliza, versiona e redistribui artefatos derivados, preservando distinções semânticas entre SPI, participantes ativos do Pix e instituições em processo de adesão. Não é a fonte oficial. Não substitui a consulta oficial.

O pacote [`@thiagoprazeres/ispb-participants`](https://www.npmjs.com/package/@thiagoprazeres/ispb-participants) continua na raiz deste repositório e funciona como o cliente oficial do catálogo. O catálogo é o produto principal; o pacote é a camada de consumo para JavaScript e TypeScript.

## O que este projeto é

- Um catálogo público derivado, com snapshots versionados, schemas explícitos, manifestos e proveniência.
- Um pacote npm público para consulta de instituições por ISPB, gerado a partir de `current/`.
- Uma pipeline diária que coleta somente fontes oficiais públicas do Banco Central, valida os artefatos e promove `current/` apenas quando tudo passa.

## O que este projeto não é

- Não é a publicação oficial primária do Banco Central.
- Não é "dados abertos oficiais".
- Não mascara divergências entre SPI, participantes ativos do Pix e instituições em adesão.
- Não faz chamadas de rede em runtime no pacote publicado.
- Não inventa equivalências silenciosas na camada `catalog_crosswalk`.

## Estrutura interna do catálogo

- `current/`: snapshot promovido mais recente e validado.
- `snapshots/YYYY-MM-DD/`: histórico versionado de snapshots bem-sucedidos.
- `schemas/`: JSON Schemas dos quatro datasets canônicos.
- `sources/registry.json`: cadastro das fontes oficiais usadas.
- `datapackage.json`: descriptor do catálogo derivado.
- `docs/`: documentação editorial e operacional da camada de catálogo.
- `src/catalog/`: núcleo canônico único de tipos, normalização, validação, matching, leitura e metadados.
- `src/generated/`: artefatos gerados consumidos pelo runtime do pacote.

## Datasets canônicos

- `spi_participants`: participantes derivados da publicação oficial pública do SPI.
- `pix_active_participants`: participantes ativos do Pix derivados da publicação oficial pública.
- `pix_in_adhesion`: instituições em processo de adesão ao Pix, mantidas separadas dos participantes ativos.
- `catalog_crosswalk`: camada derivada conservadora de ligação entre datasets, sempre preservando origem e critério de matching.

## Instalação

```bash
npm install @thiagoprazeres/ispb-participants
```

## Uso

```ts
import {
  getInstitution,
  getMetadata,
  getCatalogMetadata,
  hasIspb,
  searchInstitutions,
} from '@thiagoprazeres/ispb-participants';

const institution = getInstitution('60746948');
const exists = hasIspb('60746948');
const results = searchInstitutions('bradesco');
const metadata = getMetadata();
const catalog = getCatalogMetadata();
```

## API pública

### `INSTITUTIONS`

Índice de instituições por ISPB de oito dígitos. A visão continua agregada por compatibilidade, mas cada entrada expõe `sourceDatasets` para deixar explícito de quais datasets canônicos ela foi derivada.

### `getInstitution(ispb: string)`

Retorna o registro completo da instituição ou `undefined`.

### `hasIspb(ispb: string)`

Retorna `true` quando o ISPB existe no snapshot embutido.

### `searchInstitutions(query: string)`

Busca case-insensitive em `name` e `shortName`.

### `getMetadata()`

Retorna:

- `source`
- `sourceUrl`
- `sourceDate`
- `recordCount`

### `getCatalogMetadata()`

Retorna:

- `catalogUrl`
- `snapshotDate`
- `manifest`
- `sources`

## Proveniência e atualização

- Frequência operacional: diária, após 06:10 BRT.
- Janela atual configurada: 06:20 BRT.
- `current/` só é promovido depois de coleta, parse, validação e escrita de artefatos.
- Se uma fonte oficial falhar, o job falha e o último snapshot válido é preservado.

Cada snapshot gera `manifest.json` com:

- `snapshot_date`
- `collected_at`
- `source_urls`
- `source_publication_dates`
- `dataset_hashes`
- `record_counts`
- `schema_versions`
- `pipeline_version`
- `validation_status`
- `warnings`
- `errors`

## Licenças

- código do projeto e do pacote npm: [MIT](./LICENSE)
- artefatos derivados do catálogo e dados embutidos no bundle: [ODC-By 1.0](./LICENSE_DATA)
- a fonte oficial permanece pertencendo ao publicador oficial, Banco Central do Brasil

## Documentação interna do catálogo

- [Visão geral do catálogo](./docs/catalog.md)
- [Datasets](./docs/datasets.md)
- [Schemas](./docs/schemas.md)
- [Proveniência](./docs/provenance.md)
- [Escopo semântico](./docs/semantic-scope.md)
- [Política de atualização](./docs/update-policy.md)
- [Licenças](./docs/licenses.md)
- [Snapshots](./docs/snapshots.md)
- [Changelog](./docs/changelog.md)

## Desenvolvimento

```bash
npm run update-catalog
npm run validate:catalog
npm run generate
npm run generate:site
npm test
npm run build
```
