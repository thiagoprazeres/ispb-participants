# Política de Atualização

## Janela operacional

- Frequência: diária
- Início operacional: após 06:10 BRT
- Cron atual no GitHub Actions: 06:20 BRT

## Regras de promoção

- A pipeline resolve a fonte oficial do dia.
- Os arquivos são coletados para uma área temporária.
- CSV e JSON derivados são gerados e validados.
- `manifest.json`, `schemas/` e `datapackage.json` são atualizados.
- `current/` só é promovido depois da validação completa.

## Em caso de falha

- O job falha.
- `current/` não é sobrescrito.
- O último snapshot válido permanece disponível.
- O diagnóstico fica explícito nos logs da execução.
