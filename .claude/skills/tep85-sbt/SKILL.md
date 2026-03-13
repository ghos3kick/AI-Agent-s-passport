---
name: tep85-sbt
description: >
  Reference for TEP-85 — the Soulbound Token (SBT) standard on TON blockchain.
  Covers the SBT specification, on-chain data layout, collection/item architecture,
  metadata format, authority mechanics, revoke/destroy, and how SBTs relate to
  TEP-62 (NFT standard) and TEP-64 (token metadata). Use this skill whenever
  the user works with Soulbound Tokens, non-transferable NFTs on TON, SBT
  collections, SBT items, proof of ownership, on-chain credentials, achievements,
  badges, certificates, KYC tokens, or any non-transferable on-chain identity primitive.
---

# TEP-85 — SBT (Soulbound Token) Standard on TON

## Overview

**TEP-85** defines Soulbound Tokens for TON — non-transferable NFTs bound to a single owner.
SBTs are used for on-chain identity, credentials, achievements, KYC attestations, membership, etc.

**GitHub TEP:** https://github.com/ton-blockchain/TEPs/blob/master/text/0085-sbt-standard.md
**Based on:** TEP-62 (NFT Standard) + TEP-64 (Token Data Standard)

SBTs reuse the NFT collection/item architecture but **disable transfers**.

## Architecture

```
SBT Collection (single contract)
├── SBT Item #0  →  bound to Owner A
├── SBT Item #1  →  bound to Owner B
├── SBT Item #2  →  bound to Owner C
└── ...
```

- **Collection contract** — deploys and manages SBT items, stores collection metadata.
- **Item contract** — individual SBT, bound to one owner, non-transferable.

Each SBT Item is a separate contract (child of the collection), with its address deterministically
derived from `(collection_address, item_index)`.

## SBT Item Interface

### Required GET Methods

SBT Items **must** implement these getters (superset of TEP-62 NFT Item):

```
get_nft_data() → (int init?, int index, slice collection_address, slice owner_address, cell individual_content)
```

- `init?` — -1 if initialized, 0 if not
- `index` — item index in collection
- `collection_address` — parent collection address
- `owner_address` — SBT owner (permanent, cannot change)
- `individual_content` — item-specific metadata cell

```
get_authority_address() → slice authority_address
```

- Returns the authority that can revoke/destroy this SBT
- Authority is typically the collection or an admin address
- Can be `addr_none` (0:00..00) if authority was revoked

```
get_revoked_time() → int revoked_time
```

- Returns 0 if SBT is active (not revoked)
- Returns Unix timestamp when SBT was revoked
- Revoked SBTs still exist on-chain but are marked invalid

### Required Internal Messages

#### Destroy (burn)

```
op: 0x1f04537a (destroy)
query_id: uint64
```

- Can be sent by **owner only**
- Destroys the SBT item contract
- Remaining balance sent back to owner

#### Revoke

```
op: 0x6f89f5e3 (revoke)
query_id: uint64
```

- Can be sent by **authority only**
- Sets `revoked_time` to `now()`
- SBT continues to exist but is marked as revoked
- Does NOT destroy the contract

#### Prove Ownership

```
op: 0x04ded148 (prove_ownership)
query_id: uint64
dest: MsgAddress        // where to send the proof
forward_payload: Cell   // arbitrary data to include
with_content: Bool      // include individual_content?
```

- Can be sent by **owner only**
- SBT sends an `ownership_proof` message to `dest`:

```
op: 0x0524c7ae (ownership_proof)
query_id: uint64
item_id: uint256
owner: MsgAddress
data: Cell              // individual_content (if with_content)
revoked_at: uint64      // 0 if not revoked
content: Cell?          // only if with_content was true
```

This is the primary mechanism for **on-chain verification** — a third-party contract
can verify SBT ownership by receiving `ownership_proof` from the SBT item.

#### Request Owner

```
op: 0xd0c3bfea (request_owner)
query_id: uint64
dest: MsgAddress
forward_payload: Cell
with_content: Bool
```

- Can be sent by **anyone**
- SBT responds with `owner_info` to `dest`:

```
op: 0x0dd607e3 (owner_info)
query_id: uint64
item_id: uint256
initiator: MsgAddress   // who sent request_owner
owner: MsgAddress
data: Cell
revoked_at: uint64
content: Cell?
```

### Transfer is DISABLED

SBT items **must reject** the standard NFT transfer message (op `0x5fcc3d14`).
Any attempt to transfer should result in an error (exit code).

## SBT Collection Interface

### Required GET Methods

```
get_collection_data() → (int next_item_index, cell collection_content, slice owner_address)
```

```
get_nft_address_by_index(int index) → slice address
```

- Returns the **deterministic address** of the SBT item at given index
- Address is computed from collection code + item init data
- Item may or may not be deployed yet

```
get_nft_content(int index, cell individual_content) → cell full_content
```

- Combines collection base URL with item individual content
- Returns full metadata cell per TEP-64

### Mint (Deploy SBT Item)

The collection deploys child SBT Item contracts. Typical mint message:

```
op: 0x01  (or custom)
query_id: uint64
index: uint64
owner: MsgAddress
content: Cell           // individual metadata
authority: MsgAddress   // who can revoke
```

Only collection owner/admin should be able to mint.

## TEP-64 Metadata Format

SBT metadata follows the standard TON token metadata format:

### On-chain Metadata

Stored in a dictionary (key = SHA256 of attribute name):

| Key (SHA256 hash) | Attribute | Value |
|---|---|---|
| `0x70...` | `name` | Snake-format string |
| `0x43...` | `description` | Snake-format string |
| `0x04...` | `image` | URL string |
| `0x46...` | `image_data` | Binary image data |

### Off-chain Metadata

Content cell contains a URL prefix. Full URL = `collection_base_url + item_individual_path`.

JSON format at the URL:

```json
{
  "name": "KYC Verified",
  "description": "This SBT certifies that the holder passed KYC verification",
  "image": "https://example.com/sbt/kyc-badge.png",
  "attributes": [
    { "trait_type": "Verification Level", "value": "Full" },
    { "trait_type": "Issued", "value": "2024-01-15" },
    { "trait_type": "Issuer", "value": "VerifyDAO" }
  ]
}
```

## Implementation in Tact

### SBT Item Contract

```tact
import "@stdlib/deploy";

message ProveOwnership {
    queryId: Int as uint64;
    dest: Address;
    forwardPayload: Cell;
    withContent: Bool;
}

message OwnershipProof {
    queryId: Int as uint64;
    itemId: Int as uint256;
    owner: Address;
    data: Cell;
    revokedAt: Int as uint64;
    content: Cell?;
}

message Revoke {
    queryId: Int as uint64;
}

message Destroy {
    queryId: Int as uint64;
}

contract SbtItem with Deployable {
    collection: Address;
    index: Int as uint64;
    owner: Address;
    authority: Address;
    content: Cell;
    revokedAt: Int as uint64;
    isInitialized: Bool;

    init(collection: Address, index: Int) {
        self.collection = collection;
        self.index = index;
        self.owner = newAddress(0, 0);    // placeholder
        self.authority = newAddress(0, 0);
        self.content = emptyCell();
        self.revokedAt = 0;
        self.isInitialized = false;
    }

    // Collection sends init data after deploy
    receive(msg: InternalSetup) {
        require(sender() == self.collection, "Only collection");
        require(!self.isInitialized, "Already initialized");
        self.owner = msg.owner;
        self.authority = msg.authority;
        self.content = msg.content;
        self.isInitialized = true;
    }

    // Owner proves ownership to a third-party contract
    receive(msg: ProveOwnership) {
        require(sender() == self.owner, "Only owner");
        let content: Cell? = msg.withContent ? self.content : null;
        send(SendParameters{
            to: msg.dest,
            value: 0,
            mode: SendRemainingValue,
            body: OwnershipProof{
                queryId: msg.queryId,
                itemId: self.index,
                owner: self.owner,
                data: msg.forwardPayload,
                revokedAt: self.revokedAt,
                content: content,
            }.asCell(),
        });
    }

    // Authority revokes the SBT
    receive(msg: Revoke) {
        require(sender() == self.authority, "Only authority");
        require(self.revokedAt == 0, "Already revoked");
        self.revokedAt = now();
    }

    // Owner can destroy (burn)
    receive(msg: Destroy) {
        require(sender() == self.owner, "Only owner");
        send(SendParameters{
            to: self.owner,
            value: 0,
            mode: SendRemainingBalance | SendDestroyIfZero,
            body: emptyCell(),
        });
    }

    // REJECT any transfer attempts
    // (NFT standard transfer opcode must be rejected)

    get fun get_nft_data(): NftData {
        return NftData{
            isInitialized: self.isInitialized,
            index: self.index,
            collection: self.collection,
            owner: self.owner,
            content: self.content,
        };
    }

    get fun get_authority_address(): Address {
        return self.authority;
    }

    get fun get_revoked_time(): Int {
        return self.revokedAt;
    }
}
```

## Verification Flow (On-chain Proof)

The key pattern for SBT-gated access:

```
1. User calls ThirdPartyContract with "I have SBT #42 from Collection X"

2. ThirdPartyContract sends request_owner to the SBT item address
   (computed deterministically from Collection X + index 42)

3. SBT Item responds with owner_info back to ThirdPartyContract

4. ThirdPartyContract verifies:
   a. sender of owner_info == expected SBT item address
   b. owner == user's address
   c. revokedAt == 0
   d. Proceed with gated action
```

OR the owner-initiated flow:

```
1. Owner sends prove_ownership to their SBT Item
   (with dest = ThirdPartyContract address)

2. SBT Item sends ownership_proof to ThirdPartyContract

3. ThirdPartyContract verifies the proof came from a known
   SBT Item address (derived from trusted collection)
```

## Use Cases

- **KYC/Identity** — SBT issued after identity verification
- **Achievements/Badges** — gaming, community milestones
- **Certificates** — course completion, professional credentials
- **Membership** — DAO membership, club access
- **Reputation** — on-chain credit score, trust score
- **Access Control** — SBT-gated contracts, services, governance
- **Attendance** — event POAPs (Proof of Attendance)

## Key Opcodes Reference

| Operation | Opcode | Sender |
|-----------|--------|--------|
| `transfer` (NFT) | `0x5fcc3d14` | **REJECTED** — SBTs are non-transferable |
| `prove_ownership` | `0x04ded148` | Owner only |
| `ownership_proof` | `0x0524c7ae` | SBT Item → destination |
| `request_owner` | `0xd0c3bfea` | Anyone |
| `owner_info` | `0x0dd607e3` | SBT Item → destination |
| `revoke` | `0x6f89f5e3` | Authority only |
| `destroy` | `0x1f04537a` | Owner only |
