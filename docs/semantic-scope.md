# Escopo Semântico

O catálogo separa semanticamente quatro visões que não devem ser confundidas:

- SPI
- participantes ativos do Pix
- instituições em adesão ao Pix
- crosswalk derivado

## Regra central

O catálogo não promove um registro de adesão para participante ativo e não converte automaticamente diferenças entre SPI e Pix.

## Critérios do `catalog_crosswalk`

- `catalog_entity_id = ispb:<ispb>` quando há ISPB
- `catalog_entity_id = cnpj:<cnpj>` apenas quando o CNPJ é único entre registros sem ISPB e não conflita com um registro portador de ISPB
- em conflito, a linha recebe `match_method = no_auto_match`

## Consequência prática

O crosswalk é útil para navegação e auditoria, mas não deve ser tratado como autorização para colapsar todas as visões em uma única lista comercial.
