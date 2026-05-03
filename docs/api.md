# API pública

Referência completa dos exports do pacote `@cafeinadesign/ispb-participants`.

---

## Índice derivado

### `INSTITUTIONS`

```ts
const INSTITUTIONS: Record<string, InstitutionEntry>
```

Índice oficial e lookup-safe de instituições por ISPB de oito dígitos. **É um índice derivado, não um dataset canônico.** Cada entrada agrega registros de até três datasets de origem e preserva `inSpi`, `inPixActive`, `inPixAdhesion`, `sourceDatasets`, `canonicalSource` e `matchConfidence`.

Contrato público: se um ISPB aparece explicitamente em `SPI_PARTICIPANTS`, `PIX_ACTIVE_PARTICIPANTS` ou `PIX_IN_ADHESION`, ele deve aparecer em `INSTITUTIONS`.

---

## Arrays canônicos

### `SPI_PARTICIPANTS`

```ts
const SPI_PARTICIPANTS: SpiParticipantRecord[]
```

Array completo de registros canônicos do dataset `spi_participants`, derivado da publicação oficial pública do SPI.

### `PIX_ACTIVE_PARTICIPANTS`

```ts
const PIX_ACTIVE_PARTICIPANTS: PixActiveParticipantRecord[]
```

Array completo de registros canônicos do dataset `pix_active_participants`, derivado da publicação oficial de participantes ativos do Pix.

### `PIX_IN_ADHESION`

```ts
const PIX_IN_ADHESION: PixInAdhesionRecord[]
```

Array completo de registros canônicos do dataset `pix_in_adhesion`. **Mantido separado de `PIX_ACTIVE_PARTICIPANTS` para preservar a distinção semântica entre adesão e participação ativa.**

---

## Funções de lookup

### `getInstitutionByIspb(ispb)`

```ts
function getInstitutionByIspb(ispb: string): InstitutionEntry | undefined
```

Retorna a entrada do índice derivado oficial para o ISPB informado (aceita com ou sem zeros à esquerda). É a função de lookup recomendada para ISPB extraído de EndToEndId. Retorna `undefined` se não encontrado.

### `getSpiParticipantByIspb(ispb)`

```ts
function getSpiParticipantByIspb(ispb: string): SpiParticipantRecord | undefined
```

Retorna o registro canônico de `spi_participants` para o ISPB. Retorna `undefined` se a instituição não está no SPI.

### `getPixActiveParticipantByIspb(ispb)`

```ts
function getPixActiveParticipantByIspb(ispb: string): PixActiveParticipantRecord | undefined
```

Retorna o registro canônico de `pix_active_participants` para o ISPB. Retorna `undefined` se não estiver entre os participantes ativos do Pix — **uma instituição em adesão não é retornada aqui**.

### `getInstitutionStatusByIspb(ispb)`

```ts
function getInstitutionStatusByIspb(ispb: string): InstitutionStatus | undefined
```

Retorna um resumo do status de participação da instituição. Útil para exibição rápida sem carregar todos os campos canônicos.

```ts
interface InstitutionStatus {
  inSpi: boolean;
  inPixActive: boolean;
  inPixAdhesion: boolean;
  matchConfidence: MatchConfidence;
  canonicalSource: string;
}
```

### `hasIspb(ispb)`

```ts
function hasIspb(ispb: string): boolean
```

Retorna `true` se o ISPB existe no índice oficial `INSTITUTIONS`.

---

## Funções de busca

### `searchInstitutionsByName(query)`

```ts
function searchInstitutionsByName(query: string): InstitutionEntry[]
```

Busca textual case-insensitive e accent-insensitive em `name` e `shortName`. Retorna array vazio se nenhuma correspondência for encontrada.

---

## Funções de metadados

### `getMetadata()`

```ts
function getMetadata(): Metadata
```

Retorna o resumo público canônico do snapshot embutido, com `snapshotDate` e contagens explícitas por dataset.

Campos canônicos do resumo público:

- `snapshotDate`
- `spiParticipantCount`
- `pixActiveParticipantCount`
- `pixInAdhesionCount`
- `crosswalkRecordCount`

Campos mantidos por compatibilidade:

- `sourceDate` — deprecated alias de `snapshotDate`
- `recordCount` — deprecated alias de `pixActiveParticipantCount`; **não** é total do catálogo

### `getCatalogMetadata()`

```ts
function getCatalogMetadata(): CatalogMetadata
```

Retorna metadados detalhados do catálogo: `catalogUrl`, `snapshotDate`, `spiParticipantCount`, `pixActiveParticipantCount`, `pixInAdhesionCount`, `crosswalkRecordCount`, `manifest`, `sources`. O `manifest` contém hashes, contagens, versões de schema, status de validação e proveniência completa.

---

## Exports de tipos

```ts
// Tipo público do índice derivado
export type { InstitutionEntry, InstitutionStatus, MatchConfidence }

// Tipo interno (mantido por compatibilidade)
export type { Institution }

// Tipos canônicos de registro
export type { SpiParticipantRecord, PixActiveParticipantRecord, PixInAdhesionRecord }

// Tipos de metadados
export type { Metadata, CatalogMetadata, SnapshotManifest, ValidationIssue }
```

---

## Funções deprecated

As seguintes funções permanecem disponíveis mas foram substituídas:

| Deprecated | Substituto |
|---|---|
| `getInstitution(ispb)` | `getInstitutionByIspb(ispb)` |
| `searchInstitutions(query)` | `searchInstitutionsByName(query)` |

---

## `MatchConfidence`

```ts
type MatchConfidence = 'exact_ispb' | 'unique_cnpj' | 'no_auto_match' | 'derived'
```

| Valor | Significado |
|---|---|
| `exact_ispb` | Derivado de registro com ISPB explícito — match seguro |
| `unique_cnpj` | Derivado por CNPJ único entre registros sem ISPB |
| `no_auto_match` | Sem match automático; CNPJ ambíguo ou ausente |
| `derived` | Entrada gerada apenas pelo índice, sem ISPB na origem |

**Não esconda `matchConfidence` do usuário final.** Incerteza deve ser explícita.
