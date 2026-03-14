# Smart Contracts

## Overview

Two Tact smart contracts deployed on TON Testnet:

- **Agent Registry** — NFT Collection (TEP-62), manages passport lifecycle and minting
- **Agent Passport** — Soulbound Token (TEP-85), individual non-transferable identity

## Agent Registry

**Address:** `EQDRdykyEDAj9GgM3sPnkj9Y-OM6IG3wX_QmI40emh2HBxZS`

### State

| Field | Type | Description |
|-------|------|-------------|
| owner | Address | Collection owner (deployer wallet) |
| nextItemIndex | uint64 | Next passport index to mint |
| collectionContent | Cell | TEP-62 collection metadata |
| mintFee | coins | Public mint fee (default: 0.05 TON) |

### Messages (Inbound)

#### MintPassport (owner only)

Admin mint — no fee required. Only callable by the Registry owner.

| Field | Type | Description |
|-------|------|-------------|
| queryId | uint64 | Query identifier |
| owner | Address | Passport owner address |
| capabilities | String | Comma-separated capabilities |
| endpoint | String | Agent API endpoint URL |
| metadataUrl | String | TEP-64 metadata URL |

**Opcode:** `3867318038`
**Gas:** ~0.05 TON (forwarded to passport init)

#### PublicMintPassport (anyone)

Public mint — requires `mintFee + 0.06 TON` minimum value. Excess over 0.01 TON is returned to sender.

| Field | Type | Description |
|-------|------|-------------|
| queryId | uint64 | Query identifier |
| owner | Address | Passport owner address |
| capabilities | String | Comma-separated capabilities |
| endpoint | String | Agent API endpoint URL |
| metadataUrl | String | TEP-64 metadata URL |

**Opcode:** `534822672`
**Minimum value:** 0.11 TON (0.05 fee + 0.06 gas)

#### SetMintFee (owner only)

Sets the public mint fee.

| Field | Type | Description |
|-------|------|-------------|
| fee | coins | New mint fee in nanoTON |

#### Withdraw (owner only)

Withdraws accumulated fees. Keeps minimum 0.1 TON balance in the contract.

| Field | Type | Description |
|-------|------|-------------|
| amount | coins | Amount to withdraw |

#### BatchIncrementTxCount (owner only)

Increments an agent's transaction counter via the Registry.

| Field | Type | Description |
|-------|------|-------------|
| passportAddress | Address | Target passport address |

#### BatchUpdateCapabilities (owner only)

Updates an agent's capabilities via the Registry.

| Field | Type | Description |
|-------|------|-------------|
| passportAddress | Address | Target passport address |
| capabilities | String | New capabilities string |

### Get-Methods

#### get_collection_data() -> CollectionData

TEP-62 standard. Returns:

| Field | Type | Description |
|-------|------|-------------|
| nextItemIndex | Int | Total passports minted |
| collectionContent | Cell | Collection metadata cell |
| owner | Address | Collection owner address |

#### get_nft_address_by_index(index: Int) -> Address

Returns the deterministic address of the passport at the given index.

#### get_nft_content(index: Int, individualContent: Cell) -> Cell

TEP-62 standard. Returns individual NFT content cell.

#### get_agent_count() -> Int

Returns `nextItemIndex` — the total number of passports minted.

#### mintFee() -> Int

Returns the current public mint fee in nanoTON.

---

## Agent Passport (SBT)

Each passport is deployed as a separate contract by the Registry during minting.

### State

| Field | Type | Description |
|-------|------|-------------|
| collection | Address | Registry (collection) address |
| index | uint64 | Passport index in the collection |
| owner | Address | Passport owner |
| authority | Address | Authority address (= Registry) |
| content | Cell | TEP-62 content cell |
| capabilities | String | Declared capabilities |
| endpoint | String | Agent API endpoint URL |
| metadataUrl | String | TEP-64 metadata URL |
| createdAt | uint64 | Creation timestamp (Unix) |
| txCount | uint64 | Transaction counter |
| revokedAt | uint64 | Revocation timestamp (0 = active) |
| isInitialized | Bool | Whether passport has been set up |

### Messages (Inbound)

#### SetupPassport (collection only)

Internal message sent by the Registry during minting. Initializes all passport fields. Can only be called once (sets `isInitialized = true`).

#### Transfer (opcode: `0x5fcc3d14`)

**Always reverts.** SBT is non-transferable per TEP-85.

#### UpdateEndpoint (owner only)

Updates the agent's endpoint URL.

| Field | Type | Description |
|-------|------|-------------|
| endpoint | String | New endpoint URL |

#### IncrementTxCount (authority only)

Increments the transaction counter by 1.

#### UpdateCapabilities (authority only)

Updates the capabilities string.

| Field | Type | Description |
|-------|------|-------------|
| capabilities | String | New capabilities string |

#### Revoke (opcode: `0x6f89f5e3`, authority only)

TEP-85 standard. Marks the passport as revoked by setting `revokedAt` to current timestamp. Only callable by authority (Registry).

#### Destroy (opcode: `0x1f04537a`, owner only)

TEP-85 standard. Burns the SBT and sends remaining balance to the owner.

#### ProveOwnership (opcode: `0x04ded148`, owner only)

TEP-85 standard. Proves ownership to a requesting contract by sending `OwnershipProof`.

#### RequestOwner (opcode: `0xd0c3bfea`, anyone)

TEP-85 standard. Returns `OwnerInfo` message with owner address.

### Get-Methods

#### get_nft_data() -> NftData

TEP-62 standard. Returns:

| Field | Type | Description |
|-------|------|-------------|
| isInitialized | Bool | Whether passport is initialized |
| index | Int | Passport index |
| collection | Address | Registry address |
| owner | Address | Passport owner |
| content | Cell | Individual content cell |

#### get_passport_data() -> PassportData

Custom get-method. Returns all passport-specific fields:

| Field | Type | Description |
|-------|------|-------------|
| endpoint | String | Agent endpoint URL |
| capabilities | String | Declared capabilities |
| metadataUrl | String | Metadata URL |
| txCount | Int | Transaction count |
| createdAt | Int | Creation timestamp |
| revokedAt | Int | Revocation timestamp |

#### get_authority_address() -> Address

TEP-85 standard. Returns the authority address (Registry contract).

#### get_revoked_time() -> Int

TEP-85 standard. Returns revocation timestamp (0 if not revoked).

---

## Fee Structure

| Action | Cost | Who Pays |
|--------|------|----------|
| Admin Mint (MintPassport) | ~0.05 TON gas | Registry owner |
| Public Mint (PublicMintPassport) | 0.05 TON fee + ~0.06 TON gas | Anyone |
| Update Endpoint | ~0.01 TON gas | Passport owner |
| Increment TX Count | ~0.01 TON gas | Registry (authority) |
| Update Capabilities | ~0.01 TON gas | Registry (authority) |
| Revoke | ~0.01 TON gas | Registry (authority) |
| Destroy | ~0.01 TON gas | Passport owner (balance returned) |
| Set Mint Fee | ~0.01 TON gas | Registry owner |
| Withdraw | ~0.01 TON gas | Registry owner |

## Security Model

- **Ownership:** Registry has a single owner (deployer wallet). Only the owner can admin-mint, withdraw, set fees, and batch-update passports.
- **Authority:** Each SBT's authority is the Registry contract address. Authority can revoke passports and update capabilities/tx count.
- **Soulbound:** `Transfer` message always reverts with "SBT: transfer not allowed".
- **Initialization:** `SetupPassport` can only be called once — `isInitialized` flag prevents re-initialization.
- **Fee protection:** `PublicMintPassport` requires minimum `mintFee + 0.06 TON`. Excess over 0.01 TON is returned.
- **Withdrawal protection:** `Withdraw` keeps minimum 0.1 TON balance in the Registry contract.

## Test Coverage

**24 tests** across two test suites:

### AgentRegistry (16 tests)
- Deploy registry
- Agent count starts at 0
- Mint single passport with correct data
- Mint multiple passports with sequential indices
- Reject mint from non-owner
- Increment tx count via registry
- Update capabilities via registry
- Return default mintFee (0.05 TON)
- Public mint with sufficient payment
- Reject public mint with insufficient payment
- Return excess on public mint overpayment
- Owner can set mint fee
- Reject SetMintFee from non-owner
- Owner can withdraw
- Reject withdraw from non-owner
- Reject withdraw that drains below minimum balance

### AgentPassport SBT (8 tests)
- Reject transfer (non-transferable)
- Owner can update endpoint
- Reject endpoint update from non-owner
- Return correct authority address
- Revoke passport (authority only)
- Reject revoke from non-authority
- Owner can destroy/burn SBT
- Handle prove_ownership and request_owner (TEP-85)
