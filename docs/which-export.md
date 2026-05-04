# Qual export usar?

Guia rápido para escolher o export certo para cada caso de uso.

---

## Quero saber se um ISPB existe

Esse é o caminho recomendado para ISPB extraído de EndToEndId.

```ts
import { hasIspb } from '@cafeina_dev/ispb-participants';
hasIspb('60746948'); // true
```

---

## Quero o nome e status resumido de uma instituição por ISPB

Esse é o lookup principal do pacote para consumo por ISPB.

```ts
import { getInstitutionByIspb } from '@cafeina_dev/ispb-participants';
const inst = getInstitutionByIspb('60746948');
// inst.name, inst.shortName, inst.inSpi, inst.inPixActive, inst.inPixAdhesion
```

---

## Quero apenas o status de participação (SPI / Pix ativo / Pix adesão)

```ts
import { getInstitutionStatusByIspb } from '@cafeina_dev/ispb-participants';
const status = getInstitutionStatusByIspb('60746948');
// { inSpi: true, inPixActive: true, inPixAdhesion: false, matchConfidence: 'exact_ispb', ... }
```

---

## Quero buscar instituições por nome

```ts
import { searchInstitutionsByName } from '@cafeina_dev/ispb-participants';
const results = searchInstitutionsByName('bradesco');
```

---

## Quero os dados canônicos completos do SPI para um ISPB específico

```ts
import { getSpiParticipantByIspb } from '@cafeina_dev/ispb-participants';
const record = getSpiParticipantByIspb('60746948');
// record.spi_participation_type, record.spi_started_at, record.raw_source_json, ...
```

---

## Quero os dados canônicos completos de participantes ativos do Pix para um ISPB

```ts
import { getPixActiveParticipantByIspb } from '@cafeina_dev/ispb-participants';
const record = getPixActiveParticipantByIspb('60746948');
// record.initiation_of_payment, record.facilitator_of_withdrawal_and_change, ...
```

**Atenção:** uma instituição em adesão (`PIX_IN_ADHESION`) não é retornada por esta função.

---

## Quero iterar todos os registros canônicos de um dataset

```ts
import {
  SPI_PARTICIPANTS,
  PIX_ACTIVE_PARTICIPANTS,
  PIX_IN_ADHESION,
} from '@cafeina_dev/ispb-participants';

for (const record of SPI_PARTICIPANTS) {
  // record.ispb, record.institution_name, record.spi_participation_type, ...
}
```

---

## Quero o índice completo de instituições

```ts
import { INSTITUTIONS } from '@cafeina_dev/ispb-participants';
// Record<string, InstitutionEntry> — chave é o ISPB com 8 dígitos
```

**Lembre:** `INSTITUTIONS` é o índice derivado oficial e lookup-safe por ISPB do pacote, não um dataset canônico. Cada entrada agrega dados de até três datasets de origem. Use `sourceDatasets`, `inSpi`, `inPixActive`, `inPixAdhesion` para entender a origem de cada dado.

---

## Resumo

| Caso de uso | Export recomendado |
|---|---|
| Checar existência | `hasIspb()` |
| Info geral por ISPB | `getInstitutionByIspb()` |
| Status de participação | `getInstitutionStatusByIspb()` |
| Busca por nome | `searchInstitutionsByName()` |
| Dados canônicos SPI | `getSpiParticipantByIspb()` ou `SPI_PARTICIPANTS` |
| Dados canônicos Pix ativo | `getPixActiveParticipantByIspb()` ou `PIX_ACTIVE_PARTICIPANTS` |
| Dados canônicos Pix adesão | `PIX_IN_ADHESION` |
| Índice agregado completo | `INSTITUTIONS` |
| Metadados do snapshot | `getMetadata()` / `getCatalogMetadata()` |
