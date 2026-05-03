# Getting Started

## Instalação

```bash
npm install @cafeinadesign/ispb-participants
```

Requer Node.js ≥ 18. Funciona com TypeScript e JavaScript (ESM e CommonJS).

## Primeiro uso

```ts
import {
  getInstitutionByIspb,
  searchInstitutionsByName,
  getInstitutionStatusByIspb,
} from '@cafeinadesign/ispb-participants';

// Lookup por ISPB
const bradesco = getInstitutionByIspb('60746948');
console.log(bradesco?.name);        // "BANCO BRADESCO S.A."
console.log(bradesco?.inSpi);       // true
console.log(bradesco?.inPixActive); // true
console.log(bradesco?.inPixAdhesion); // false

// Busca por nome
const resultados = searchInstitutionsByName('nubank');
for (const inst of resultados) {
  console.log(inst.ispb, inst.name, inst.matchConfidence);
}

// Status resumido
const status = getInstitutionStatusByIspb('60746948');
// { inSpi: true, inPixActive: true, inPixAdhesion: false,
//   matchConfidence: 'exact_ispb', canonicalSource: '...' }
```

## O que o pacote contém

Os dados estão embutidos no bundle — não há chamadas de rede em runtime. O snapshot é atualizado diariamente pelo pipeline e publicado via `npm publish`.

Cada entrada em `INSTITUTIONS` é o índice derivado oficial para lookup por ISPB, não um dataset canônico. Os dados canônicos brutos continuam disponíveis como arrays separados: `SPI_PARTICIPANTS`, `PIX_ACTIVE_PARTICIPANTS`, `PIX_IN_ADHESION`.

## Próximos passos

- [API pública](./api.md) — referência completa de exports
- [Qual export usar?](./which-export.md) — guia decisório
- [Datasets canônicos](./datasets.md) — estrutura e semântica dos quatro datasets
- [Escopo semântico](./semantic-scope.md) — por que INSTITUTIONS não é canônico
- [Proveniência](./provenance.md) — origem dos dados
