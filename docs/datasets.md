# Datasets

## `spi_participants`

Dataset derivado da publicação oficial pública do SPI. É a visão canônica dos participantes do SPI e concentra campos como ISPB, CNPJ, nome da instituição, nome reduzido, tipo de participação no SPI e modalidade Pix publicada na origem do SPI.

## `pix_active_participants`

Dataset derivado da publicação oficial pública de participantes ativos do Pix. Preserva tipo de instituição, autorização pelo BCB, tipo de participação no SPI e no Pix, modalidade de participação e marcações específicas do arquivo oficial.

## `pix_in_adhesion`

Dataset derivado da publicação oficial pública de instituições em processo de adesão ao Pix. Existe de forma separada para impedir que a camada derivada apresente adesão como se fosse participação ativa.

## `catalog_crosswalk`

Camada derivada de ligação entre datasets. Cada linha aponta para um registro de origem e informa o método de matching:

- `exact_ispb`: unificação por ISPB exato
- `unique_cnpj`: unificação por CNPJ único quando não conflita com registro portador de ISPB
- `no_auto_match`: sem unificação automática por ausência de evidência segura
