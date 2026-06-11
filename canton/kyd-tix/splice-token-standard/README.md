# Vendored: Canton Network token standard interfaces (CIP-56)

`Api/Token/{MetadataV1,HoldingV1,AllocationV1}.daml` are vendored unmodified
from [hyperledger-labs/splice](https://github.com/hyperledger-labs/splice)
(`token-standard/splice-api-token-*-v1`, fetched from `main` on 2026-06-11),
licensed Apache-2.0 (SPDX headers retained in each file).

They are vendored at **source level** so this project builds self-contained on
Daml SDK 2.10 / LF 1.17. On a Canton Network deployment you do NOT use this
copy: depend on the **official released DARs** (`splice-api-token-metadata-v1`,
`splice-api-token-holding-v1`, `splice-api-token-allocation-v1`) so your
package references the canonical package ids that Canton Coin, USDCx and the
ecosystem wallets implement. The Daml code in `Kyd.*` is written purely against
the interface types, so the swap is a `daml.yaml` data-dependency change.
