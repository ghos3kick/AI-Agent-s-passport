---
name: tact-lang
description: >
  Reference for the Tact programming language — a high-level, statically-typed language for TON
  blockchain smart contracts that compiles to FunC → Fift → TVM bytecode. Use this skill whenever
  the user writes, reviews, debugs, or asks about Tact smart contracts, TON contract architecture,
  message handling, contract state, or anything involving .tact files. Also trigger when the user
  mentions TON smart contracts generically — Tact is the default choice.
---

# Tact Language — Smart Contracts for TON

## What is Tact

Tact is a high-level, statically-typed language for writing smart contracts on The Open Network (TON).
It compiles through the chain: **Tact → FunC → Fift → TVM bytecode**.
Tact is designed to be safer and more approachable than raw FunC, with familiar syntax for developers
coming from TypeScript/Swift/Kotlin.

**Official docs:** https://tact-lang.org/
**GitHub:** https://github.com/tact-lang/tact

## Core Concepts

### Contract Structure

```tact
import "@stdlib/deploy";
import "@stdlib/ownable";

// Message declarations (TL-B style, auto-serialized)
message Transfer {
    to: Address;
    amount: Int as coins;
    comment: String?;
}

message(0x05138d91) TokenNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    forwardPayload: Slice as remaining;
}

// Contract definition
contract MyContract with Deployable, Ownable {

    owner: Address;       // persistent state variable
    counter: Int as uint32;

    // Constructor — called once on deploy
    init(owner: Address) {
        self.owner = owner;
        self.counter = 0;
    }

    // Internal message receiver
    receive(msg: Transfer) {
        require(sender() == self.owner, "Not owner");
        send(SendParameters{
            to: msg.to,
            value: msg.amount,
            mode: SendRemainingValue | SendIgnoreErrors,
            body: msg.comment.asComment(),
        });
    }

    // Empty message receiver (plain TON transfers)
    receive() {
        // accept incoming TON
    }

    // Text comment receiver
    receive("increment") {
        self.counter += 1;
    }

    // Bounce handler
    bounced(src: bounced<Transfer>) {
        // handle bounced message
    }

    // Getter function (off-chain reads)
    get fun counter(): Int {
        return self.counter;
    }

    get fun balance(): Int {
        return myBalance();
    }
}
```

### Type System

| Type | Description | Serialization hints |
|------|-------------|-------------------|
| `Int` | 257-bit signed integer | `as uint8`, `as uint32`, `as uint64`, `as uint128`, `as uint256`, `as int8`, ..., `as coins` |
| `Bool` | true / false | |
| `Address` | TON address (267 bits) | |
| `Cell` | Raw TVM cell | |
| `Slice` | Cell slice for reading | `as remaining` — read rest of slice |
| `Builder` | Cell builder for writing | |
| `String` | UTF-8 string | |
| `StringBuilder` | Efficient string concatenation | |
| `map<K, V>` | On-chain dictionary | K: `Int` or `Address`; V: any |

Optional types use `?` suffix: `String?`, `Address?`.

### Messages & Structs

```tact
// Struct — data container, no opcode
struct UserInfo {
    name: String;
    balance: Int as coins;
}

// Message — has 32-bit opcode, used for communication
message(0xABCD1234) CustomOp {
    data: Cell;
}

// If no opcode specified, it's auto-generated from name hash
message Deploy {
    queryId: Int as uint64;
}
```

### Sending Messages

```tact
send(SendParameters{
    to: address,
    value: ton("0.05"),          // amount in nanotons
    mode: SendIgnoreErrors,       // send mode flags
    bounce: true,                 // bounce on failure (default true)
    body: MessageBody.asCell(),   // message body
    code: null,                   // init code (for deploy)
    data: null,                   // init data (for deploy)
});
```

**Send modes (combinable with `|`):**
- `SendIgnoreErrors` (2) — don't fail if send fails
- `SendPayGasSeparately` (1) — pay gas from contract balance, not from value
- `SendRemainingValue` (64) — forward remaining incoming value
- `SendRemainingBalance` (128) — send entire contract balance
- `SendDestroyIfZero` (32) — destroy contract if balance becomes 0

### Maps (On-chain Dictionaries)

```tact
contract TokenBalances {
    balances: map<Address, Int as coins>;

    init() {
        self.balances = emptyMap();
    }

    receive(msg: Transfer) {
        let current: Int? = self.balances.get(sender());
        let balance: Int = current != null ? current!! : 0;
        require(balance >= msg.amount, "Insufficient");

        self.balances.set(sender(), balance - msg.amount);

        let recipientBal: Int? = self.balances.get(msg.to);
        let rBal: Int = recipientBal != null ? recipientBal!! : 0;
        self.balances.set(msg.to, rBal + msg.amount);
    }
}
```

### Traits (Mixins)

```tact
trait Stoppable with Ownable {
    stopped: Bool;
    owner: Address;

    receive("stop") {
        self.requireOwner();
        self.stopped = true;
    }

    get fun stopped(): Bool {
        return self.stopped;
    }

    fun requireNotStopped() {
        require(!self.stopped, "Contract stopped");
    }
}

// Usage
contract MyContract with Deployable, Ownable, Stoppable {
    owner: Address;
    stopped: Bool;

    init(owner: Address) {
        self.owner = owner;
        self.stopped = false;
    }
}
```

### Standard Library Traits

Import from `@stdlib/`:

- **`@stdlib/deploy`** → `Deployable` trait (standard deploy receiver)
- **`@stdlib/ownable`** → `Ownable`, `OwnableTransferable`
- **`@stdlib/stoppable`** → `Stoppable`, `Resumable`

### Key Built-in Functions

```tact
sender()            // Address of message sender
myAddress()         // This contract's address
myBalance()         // Contract balance in nanotons
now()               // Current Unix timestamp
ton("1.5")          // Convert TON string to nanotons
newAddress(wc, hash) // Construct address from workchain + hash
nativeRandom()      // Random 256-bit number
emit(body.asCell()) // Emit external out message (for indexers)
require(cond, msg)  // Revert with message if false

// Address methods
addr.asSlice()

// String
beginString()       // Returns StringBuilder
sb.append(str)
sb.toString()

// Cell/Slice
beginCell()         // Returns Builder
b.storeUint(val, bits)
b.storeAddress(addr)
b.endCell()         // Returns Cell
cell.asSlice()
s.loadUint(bits)
s.loadAddress()
```

### Contract Communication Pattern

TON uses the **actor model** — contracts communicate via async messages.
Typical pattern for multi-contract interaction:

```
UserWallet → MainContract → ChildContract → MainContract (callback) → UserWallet (notification)
```

Each `→` is an **internal message** that costs gas. Always design with:
1. **Gas management** — pass enough TON for the full chain
2. **Bounce handling** — handle failed messages
3. **Query IDs** — track request/response pairs

## Common Patterns

### Deploy Child Contracts

```tact
contract Parent {
    // ...
    fun deployChild(owner: Address): Address {
        let init: StateInit = initOf ChildContract(owner, myAddress());
        send(SendParameters{
            to: contractAddress(init),
            value: ton("0.05"),
            mode: SendIgnoreErrors,
            code: init.code,
            data: init.data,
            body: Deploy{queryId: 0}.asCell(),
        });
        return contractAddress(init);
    }
}
```

### Proxy / Forwarding

```tact
receive(msg: Slice) {
    // Forward any message to another contract
    send(SendParameters{
        to: self.target,
        value: 0,
        mode: SendRemainingValue,
        body: msg.asCell(),
    });
}
```

## Important TON/Tact Gotchas

1. **Storage fees** — contracts pay rent for on-chain storage. Keep state minimal.
2. **Gas is paid per message** — multi-hop chains multiply gas costs.
3. **Everything is async** — no cross-contract calls that return values in same tx.
4. **Addresses are derived from code+data** — same init = same address (deterministic).
5. **Bounced messages** lose the first 32 bits of body (opcode). Use `bounced<MsgType>`.
6. **Maps are expensive** — large maps cost storage fees. Consider child contracts for unbounded data.
7. **`ton("1.0")` = 1,000,000,000 nanotons**.
8. **No floating point** — all math is integer. Use coins (nanotons) for amounts.
