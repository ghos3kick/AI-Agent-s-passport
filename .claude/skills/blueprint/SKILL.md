---
name: blueprint
description: >
  Reference for Blueprint — the official development environment for TON smart contracts.
  Covers project setup, compiling Tact/FunC contracts, writing tests with Sandbox,
  deploying to testnet/mainnet, and project structure. Use this skill whenever the user
  creates a new TON project, writes contract tests, runs deploys, works with
  @ton/blueprint, @ton/sandbox, @ton/test-utils, or mentions Blueprint, TON testing,
  TON deployment, or asks how to structure a TON contract project.
---

# Blueprint — TON Development Environment

## Overview

Blueprint is the official dev framework for TON smart contracts (by TON Foundation).
It handles the full lifecycle: **scaffold → compile → test → deploy**.

**GitHub:** https://github.com/ton-org/blueprint
**Key packages:**
- `@ton/blueprint` — CLI & project scaffolding
- `@ton/sandbox` — local blockchain emulator for tests
- `@ton/core` — low-level TON primitives (Cell, Address, etc.)
- `@ton/ton` — TonClient for network interaction
- `@ton/test-utils` — Jest matchers for TON

## Quick Start

```bash
# Create new project
npm create ton@latest
# Prompts: project name, Tact or FunC, first contract name

# Or add to existing project
npm install @ton/blueprint @ton/core @ton/sandbox @ton/test-utils
```

## Project Structure

```
my-ton-project/
├── contracts/           # .tact or .fc source files
│   └── MyContract.tact
├── wrappers/            # TypeScript wrappers for contracts
│   └── MyContract.ts
├── tests/               # Jest test files
│   └── MyContract.spec.ts
├── scripts/             # Deploy & interaction scripts
│   └── deployMyContract.ts
├── tact.config.json     # Tact compiler config (if using Tact)
├── package.json
└── tsconfig.json
```

## Compilation

### Tact Config (`tact.config.json`)

```json
{
  "projects": [
    {
      "name": "MyContract",
      "path": "./contracts/MyContract.tact",
      "output": "./build/MyContract"
    }
  ]
}
```

### Compile Command

```bash
npx blueprint build
# or specific contract:
npx blueprint build MyContract
```

Build output goes to `build/` directory:
- `MyContract.code.boc` — compiled bytecode
- `MyContract.abi` — ABI for interaction
- TypeScript bindings (auto-generated from Tact)

## Wrappers

Wrappers provide a TypeScript interface to interact with contracts.
**For Tact contracts**, wrappers are auto-generated during compilation.
**For FunC contracts**, you write them manually.

### Auto-Generated Tact Wrapper (typical output)

```typescript
// build/MyContract/tact_MyContract.ts (auto-generated)
import { Contract, ContractProvider, Address, Cell, Sender } from '@ton/core';

export class MyContract implements Contract {
    static fromAddress(address: Address) { /* ... */ }
    static fromInit(owner: Address) { /* ... */ }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) { /* ... */ }
    async sendTransfer(provider: ContractProvider, via: Sender, value: bigint, opts: TransferOpts) { /* ... */ }
    async getCounter(provider: ContractProvider): Promise<bigint> { /* ... */ }
}
```

### Manual Wrapper Pattern (FunC or custom)

```typescript
// wrappers/MyContract.ts
import {
    Address, beginCell, Cell, Contract, contractAddress,
    ContractProvider, Sender, SendMode, toNano
} from '@ton/core';

export type MyContractConfig = {
    owner: Address;
    counter: number;
};

export function myContractConfigToCell(config: MyContractConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeUint(config.counter, 32)
        .endCell();
}

export class MyContract implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromConfig(config: MyContractConfig, code: Cell, workchain = 0) {
        const data = myContractConfigToCell(config);
        const init = { code, data };
        return new MyContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendIncrement(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x37491f2f, 32) // opcode
                .storeUint(0, 64)           // query_id
                .endCell(),
        });
    }

    async getCounter(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('counter', []);
        return result.stack.readBigNumber();
    }
}
```

## Testing with Sandbox

Sandbox provides a **local TVM emulator** — no network needed, instant execution.

### Test File Template

```typescript
// tests/MyContract.spec.ts
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address } from '@ton/core';
import { MyContract } from '../wrappers/MyContract'; // or from build output
import '@ton/test-utils'; // adds .toHaveTransaction() matcher

describe('MyContract', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let myContract: SandboxContract<MyContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        // For Tact contracts (using auto-generated wrapper):
        myContract = blockchain.openContract(
            await MyContract.fromInit(deployer.address)
        );

        // Deploy
        const deployResult = await myContract.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Deploy', queryId: 0n }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: myContract.address,
            deploy: true,
            success: true,
        });
    });

    it('should increment counter', async () => {
        const before = await myContract.getCounter();

        const result = await myContract.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            'increment'  // text message
        );

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: myContract.address,
            success: true,
        });

        const after = await myContract.getCounter();
        expect(after).toBe(before + 1n);
    });

    it('should reject non-owner', async () => {
        const attacker = await blockchain.treasury('attacker');

        const result = await myContract.send(
            attacker.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Transfer', to: attacker.address, amount: toNano('1') }
        );

        expect(result.transactions).toHaveTransaction({
            from: attacker.address,
            to: myContract.address,
            success: false,
            exitCode: 132, // require() failure
        });
    });
});
```

### Key Sandbox APIs

```typescript
// Blockchain
const blockchain = await Blockchain.create();
blockchain.now       // current time, settable
blockchain.now = Math.floor(Date.now() / 1000) + 3600; // advance 1 hour

// Treasury (test wallets with 1M TON each)
const wallet = await blockchain.treasury('any-name');
wallet.address       // Address
wallet.getSender()   // Sender for contract calls

// Open contract on sandbox
const contract = blockchain.openContract(contractInstance);

// Send messages (Tact-style)
const result = await contract.send(
    sender,
    { value: toNano('0.05') },
    messageBody  // string for text, or { $$type: 'MsgName', ...fields }
);

// Check transactions
expect(result.transactions).toHaveTransaction({
    from: address,
    to: address,
    success: true,        // or false
    deploy: true,         // was it a deploy tx
    exitCode: 0,          // TVM exit code
    op: 0x12345678,       // message opcode
    value: toNano('1'),   // transferred value
});

// Read getters
const value = await contract.getMyGetter();
```

### Transaction Matcher Fields

The `.toHaveTransaction()` matcher accepts:

| Field | Type | Description |
|-------|------|-------------|
| `from` | Address | Sender address |
| `to` | Address | Destination address |
| `on` | Address | Contract that processed tx |
| `success` | boolean | Did tx succeed |
| `exitCode` | number | TVM exit code (0 = success) |
| `deploy` | boolean | Was this a deploy |
| `op` | number | Message opcode |
| `value` | bigint | TON transferred |
| `body` | Cell | Message body |
| `outMessagesCount` | number | Number of outgoing messages |

## Deployment

### Deploy Script

```typescript
// scripts/deployMyContract.ts
import { toNano } from '@ton/core';
import { MyContract } from '../wrappers/MyContract';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const myContract = provider.open(
        await MyContract.fromInit(provider.sender().address!)
    );

    await myContract.send(
        provider.sender(),
        { value: toNano('0.05') },
        { $$type: 'Deploy', queryId: 0n }
    );

    await provider.waitForDeploy(myContract.address);
    console.log('Deployed at:', myContract.address);

    // Verify
    const counter = await myContract.getCounter();
    console.log('Initial counter:', counter);
}
```

### Run Deploy

```bash
# Testnet (uses wallet connection via QR code or Tonkeeper deeplink)
npx blueprint run deployMyContract --testnet

# Mainnet
npx blueprint run deployMyContract --mainnet

# Custom network
npx blueprint run deployMyContract --custom https://your-endpoint.com/jsonRPC
```

### Running Tests

```bash
npx jest                     # run all tests
npx jest MyContract          # run specific test file
npx jest --verbose           # detailed output
```

## CLI Commands Summary

```bash
npx blueprint create ContractName   # scaffold new contract + wrapper + test + deploy
npx blueprint build                 # compile all contracts
npx blueprint build ContractName    # compile specific contract
npx blueprint run scriptName        # run deploy/interaction script
npx blueprint test                  # alias for npx jest
```

## Common Patterns

### Multi-contract Testing

```typescript
it('should handle parent-child interaction', async () => {
    const parent = blockchain.openContract(/* ... */);
    const childAddress = await parent.getChildAddress(deployer.address);

    // Send to parent, which deploys child
    const result = await parent.send(
        deployer.getSender(),
        { value: toNano('0.1') },
        { $$type: 'CreateChild', owner: deployer.address }
    );

    // Verify child was deployed
    expect(result.transactions).toHaveTransaction({
        from: parent.address,
        to: childAddress,
        deploy: true,
        success: true,
    });

    // Now interact with child
    const child = blockchain.openContract(
        ChildContract.fromAddress(childAddress)
    );
    const owner = await child.getOwner();
    expect(owner.equals(deployer.address)).toBe(true);
});
```

### Gas Testing

```typescript
it('should cost reasonable gas', async () => {
    const result = await contract.send(/* ... */);
    const tx = result.transactions[1]; // first tx after external
    const gasFee = tx.totalFees.coins;
    expect(gasFee).toBeLessThan(toNano('0.01'));
});
```
