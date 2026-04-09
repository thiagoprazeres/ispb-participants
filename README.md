<img src="https://thiagoprazeres.github.io/ispb-participants/logo.svg" alt="ISPB Participants Catalog" width="260" height="52">

_Catálogo público derivado de fonte oficial do Banco Central_

[![npm](https://img.shields.io/npm/v/@thiagoprazeres/ispb-participants)](https://www.npmjs.com/package/@thiagoprazeres/ispb-participants)
[![license code](https://img.shields.io/badge/code-MIT-blue)](./LICENSE)
[![license data](https://img.shields.io/badge/data-ODC--By%201.0-0b7285)](./LICENSE_DATA)

O ISPB Participants Catalog é um catálogo público derivado de fonte oficial do Banco Central do Brasil para participantes do SPI e do Pix. O projeto coleta, valida, normaliza, versiona e redistribui artefatos derivados, preservando distinções semânticas entre SPI, participantes ativos do Pix e instituições em processo de adesão.

**Não é a fonte oficial. Não substitui a consulta oficial.**

## Contagens públicas

Este repositório é um catálogo **multi-dataset**. As contagens públicas devem ser lidas por dataset, usando `current/manifest.json` como fonte de verdade.

- `910` refere-se **somente** a `pix_active_participants` no snapshot atual.
- `892` refere-se a `spi_participants` no snapshot atual.
- `21` refere-se a `pix_in_adhesion` no snapshot atual.
- `1823` refere-se a `catalog_crosswalk` no snapshot atual.

Não existe um único número genérico de manchete que represente “o tamanho total do catálogo”, porque o catálogo combina datasets com escopos semânticos diferentes e um crosswalk derivado.

## Getting started

```bash
npm install @thiagoprazeres/ispb-participants
```

```ts
import {
  getInstitutionByIspb,
  getInstitutionStatusByIspb,
  searchInstitutionsByName,
  hasIspb,
} from '@thiagoprazeres/ispb-participants';

// Lookup por ISPB
const inst = getInstitutionByIspb('60746948');
console.log(inst?.name);          // "BANCO BRADESCO S.A."
console.log(inst?.inSpi);         // true
console.log(inst?.inPixActive);   // true
console.log(inst?.inPixAdhesion); // false
console.log(inst?.matchConfidence); // "exact_ispb"

// Status resumido
const status = getInstitutionStatusByIspb('60746948');

// Busca por nome
const resultados = searchInstitutionsByName('nubank');

// Checar existência
const existe = hasIspb('60746948'); // true
```

> [Documentação completa de getting started →](./docs/getting-started.md)

## API pública

| Export | Tipo | Descrição |
|---|---|---|
| `INSTITUTIONS` | `Record<string, InstitutionEntry>` | Índice derivado oficial e lookup-safe por ISPB — **não canônico** |
| `SPI_PARTICIPANTS` | `SpiParticipantRecord[]` | Dataset canônico completo do SPI |
| `PIX_ACTIVE_PARTICIPANTS` | `PixActiveParticipantRecord[]` | Dataset canônico de ativos do Pix |
| `PIX_IN_ADHESION` | `PixInAdhesionRecord[]` | Dataset canônico de adesão ao Pix |
| `getInstitutionByIspb(ispb)` | função | Lookup por ISPB no índice derivado |
| `getSpiParticipantByIspb(ispb)` | função | Lookup canônico no SPI |
| `getPixActiveParticipantByIspb(ispb)` | função | Lookup canônico no Pix ativo |
| `getInstitutionStatusByIspb(ispb)` | função | Status resumido de participação |
| `searchInstitutionsByName(query)` | função | Busca por nome (ascii-folded) |
| `hasIspb(ispb)` | função | Verifica existência no índice |
| `getMetadata()` | função | Resumo público canônico com contagens explícitas por dataset |
| `getCatalogMetadata()` | função | Metadados completos do catálogo com as mesmas contagens explícitas |

> [Referência completa da API →](./docs/api.md) | [Qual export usar? →](./docs/which-export.md)

## `INSTITUTIONS` é o índice oficial de lookup por ISPB — e não um dataset canônico

`INSTITUTIONS` é a camada derivada oficial para consumo por ISPB no pacote. Ela existe para que um ISPB válido extraído de um EndToEndId do Pix possa ser resolvido sem falso negativo sempre que esse ISPB aparecer explicitamente em qualquer dataset canônico.

Os datasets canônicos continuam separados (`SPI_PARTICIPANTS`, `PIX_ACTIVE_PARTICIPANTS`, `PIX_IN_ADHESION`). `INSTITUTIONS` não substitui essa separação: ele só fornece um índice derivado e lookup-safe por ISPB. Cada entrada preserva marcadores explícitos de origem:

```ts
inst.inSpi         // boolean — está em spi_participants?
inst.inPixActive   // boolean — está em pix_active_participants?
inst.inPixAdhesion // boolean — está em pix_in_adhesion?
inst.matchConfidence // 'exact_ispb' | 'unique_cnpj' | 'no_auto_match' | 'derived'
inst.sourceDatasets  // datasets canônicos que contribuíram
```

**Adesão ≠ participação ativa.** Se `inPixActive` é `false` e `inPixAdhesion` é `true`, a instituição está em processo de adesão — não é participante ativo do Pix.

> [Escopo semântico →](./docs/semantic-scope.md) | [Datasets →](./docs/datasets.md)

## O que este projeto é

- Um catálogo público derivado, com snapshots versionados, schemas explícitos, manifestos e proveniência auditável.
- Um pacote npm público para consulta de participantes por ISPB, gerado a partir de `current/`.
- Uma pipeline diária que coleta somente fontes oficiais públicas do Banco Central, valida os artefatos e promove `current/` apenas quando tudo passa.

## O que este projeto não é

- Não é a publicação oficial primária do Banco Central.
- Não é "dados abertos oficiais".
- Não mascara divergências entre SPI, participantes ativos do Pix e instituições em adesão.
- Não faz chamadas de rede em runtime no pacote publicado.
- Não inventa equivalências silenciosas.

## Estrutura interna

- `current/` — snapshot promovido mais recente e validado.
- `snapshots/YYYY-MM-DD/` — histórico versionado de snapshots.
- `schemas/` — JSON Schemas dos quatro datasets canônicos.
- `sources/registry.json` — cadastro das fontes oficiais.
- `datapackage.json` — descriptor do catálogo derivado.
- `docs/` — documentação editorial e operacional.
- `src/catalog/` — núcleo canônico único de tipos, normalização, validação, matching e metadados.
- `src/generated/` — artefatos gerados consumidos pelo runtime do pacote.
- `web/` — SSG que gera o site estático em `site/`.

## Datasets canônicos

| Dataset | Origem |
|---|---|
| `spi_participants` | Publicação oficial pública do SPI |
| `pix_active_participants` | Publicação oficial de participantes ativos do Pix |
| `pix_in_adhesion` | Publicação oficial de instituições em adesão ao Pix |
| `catalog_crosswalk` | Camada derivada conservadora de ligação entre datasets |

## Proveniência e atualização

- Pipeline diária às 06:20 BRT.
- `current/` só é promovido após coleta, parse, validação e escrita de artefatos bem-sucedidos.
- Se uma fonte oficial falhar, o job falha e o último snapshot válido é preservado.

> [Política de atualização →](./docs/update-policy.md) | [Proveniência →](./docs/provenance.md)

## Licenças

- Código do projeto e do pacote npm: [MIT](./LICENSE)
- Artefatos derivados do catálogo e dados embutidos no bundle: [ODC-By 1.0](./LICENSE_DATA)
- A fonte oficial permanece pertencendo ao publicador oficial, Banco Central do Brasil

## Documentação

- [Getting started](./docs/getting-started.md)
- [API pública](./docs/api.md)
- [Qual export usar?](./docs/which-export.md)
- [Datasets](./docs/datasets.md)
- [Escopo semântico](./docs/semantic-scope.md)
- [Schemas](./docs/schemas.md)
- [Contagens e escopo](./docs/counts.md)
- [Proveniência](./docs/provenance.md)
- [Política de atualização](./docs/update-policy.md)
- [Licenças](./docs/licenses.md)
- [Snapshots](./docs/snapshots.md)
- [Changelog](./docs/changelog.md)
- [Visão geral do catálogo](./docs/catalog.md)

## Desenvolvimento

```bash
npm run update-catalog    # coleta e promove snapshot
npm run validate:catalog  # valida artefatos de current/
npm run generate          # gera src/generated/ e docs derivados
npm run build:web         # gera o site estático em site/
npm test                  # roda testes
npm run build             # compila o pacote npm
```
