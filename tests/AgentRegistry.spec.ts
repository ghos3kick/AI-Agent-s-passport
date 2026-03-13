import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell } from '@ton/core';
import { AgentRegistry } from '../build/AgentRegistry/AgentRegistry_AgentRegistry';
import { AgentPassport } from '../build/AgentRegistry/AgentRegistry_AgentPassport';
import '@ton/test-utils';

describe('AgentRegistry', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let registry: SandboxContract<AgentRegistry>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        const collectionContent = beginCell()
            .storeUint(1, 8)
            .storeStringTail('https://agent-passport.example.com/collection.json')
            .endCell();

        registry = blockchain.openContract(
            await AgentRegistry.fromInit(deployer.address, collectionContent)
        );

        const deployResult = await registry.send(
            deployer.getSender(),
            { value: toNano('0.1') },
            { $$type: 'Deploy', queryId: 0n }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: registry.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy registry', async () => {
        const data = await registry.getGetCollectionData();
        expect(data.nextItemIndex).toBe(0n);
        expect(data.owner.equals(deployer.address)).toBe(true);
    });

    it('should return agent count = 0 initially', async () => {
        const count = await registry.getGetAgentCount();
        expect(count).toBe(0n);
    });

    it('should mint a passport', async () => {
        const agentOwner = await blockchain.treasury('agent1');

        const mintResult = await registry.send(
            deployer.getSender(),
            { value: toNano('0.2') },
            {
                $$type: 'MintPassport',
                queryId: 1n,
                owner: agentOwner.address,
                capabilities: 'translation,summarization',
                endpoint: 'https://agent1.example.com/api',
                metadataUrl: 'https://agent1.example.com/metadata.json',
            }
        );

        const passportAddress = await registry.getGetNftAddressByIndex(0n);

        expect(mintResult.transactions).toHaveTransaction({
            from: registry.address,
            to: passportAddress,
            deploy: true,
            success: true,
        });

        const count = await registry.getGetAgentCount();
        expect(count).toBe(1n);

        const passport = blockchain.openContract(
            AgentPassport.fromAddress(passportAddress)
        );

        const nftData = await passport.getGetNftData();
        expect(nftData.isInitialized).toBe(true);
        expect(nftData.index).toBe(0n);
        expect(nftData.collection.equals(registry.address)).toBe(true);
        expect(nftData.owner.equals(agentOwner.address)).toBe(true);

        const passportData = await passport.getGetPassportData();
        expect(passportData.capabilities).toBe('translation,summarization');
        expect(passportData.endpoint).toBe('https://agent1.example.com/api');
        expect(passportData.txCount).toBe(0n);
        expect(passportData.revokedAt).toBe(0n);
        expect(passportData.createdAt).toBeGreaterThan(0n);
    });

    it('should mint multiple passports with sequential indices', async () => {
        const agent1 = await blockchain.treasury('agent1');
        const agent2 = await blockchain.treasury('agent2');

        await registry.send(deployer.getSender(), { value: toNano('0.2') }, {
            $$type: 'MintPassport', queryId: 1n,
            owner: agent1.address, capabilities: 'translation',
            endpoint: 'https://a1.com', metadataUrl: 'https://a1.com/meta.json',
        });

        await registry.send(deployer.getSender(), { value: toNano('0.2') }, {
            $$type: 'MintPassport', queryId: 2n,
            owner: agent2.address, capabilities: 'coding',
            endpoint: 'https://a2.com', metadataUrl: 'https://a2.com/meta.json',
        });

        const count = await registry.getGetAgentCount();
        expect(count).toBe(2n);

        const addr0 = await registry.getGetNftAddressByIndex(0n);
        const addr1 = await registry.getGetNftAddressByIndex(1n);
        expect(addr0.equals(addr1)).toBe(false);
    });

    it('should reject mint from non-owner', async () => {
        const attacker = await blockchain.treasury('attacker');

        const result = await registry.send(
            attacker.getSender(),
            { value: toNano('0.2') },
            {
                $$type: 'MintPassport', queryId: 1n,
                owner: attacker.address, capabilities: 'hack',
                endpoint: 'https://evil.com', metadataUrl: 'https://evil.com/m.json',
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: attacker.address,
            to: registry.address,
            success: false,
        });
    });

    it('should increment tx count via registry', async () => {
        const agentOwner = await blockchain.treasury('agent1');

        await registry.send(deployer.getSender(), { value: toNano('0.2') }, {
            $$type: 'MintPassport', queryId: 1n,
            owner: agentOwner.address, capabilities: 'test',
            endpoint: 'https://a.com', metadataUrl: 'https://a.com/m.json',
        });

        const passportAddress = await registry.getGetNftAddressByIndex(0n);

        const result = await registry.send(deployer.getSender(), { value: toNano('0.1') }, {
            $$type: 'BatchIncrementTxCount', queryId: 2n, agentIndex: 0n,
        });

        expect(result.transactions).toHaveTransaction({
            from: registry.address,
            to: passportAddress,
            success: true,
        });

        const passport = blockchain.openContract(AgentPassport.fromAddress(passportAddress));
        const data = await passport.getGetPassportData();
        expect(data.txCount).toBe(1n);
    });

    it('should update capabilities via registry', async () => {
        const agentOwner = await blockchain.treasury('agent1');

        await registry.send(deployer.getSender(), { value: toNano('0.2') }, {
            $$type: 'MintPassport', queryId: 1n,
            owner: agentOwner.address, capabilities: 'old',
            endpoint: 'https://a.com', metadataUrl: 'https://a.com/m.json',
        });

        const passportAddress = await registry.getGetNftAddressByIndex(0n);

        await registry.send(deployer.getSender(), { value: toNano('0.1') }, {
            $$type: 'BatchUpdateCapabilities', queryId: 2n,
            agentIndex: 0n, newCapabilities: 'new,updated',
        });

        const passport = blockchain.openContract(AgentPassport.fromAddress(passportAddress));
        const data = await passport.getGetPassportData();
        expect(data.capabilities).toBe('new,updated');
    });
});

describe('AgentPassport (SBT)', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let registry: SandboxContract<AgentRegistry>;
    let agentOwner: SandboxContract<TreasuryContract>;
    let passport: SandboxContract<AgentPassport>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        agentOwner = await blockchain.treasury('agentOwner');

        const collectionContent = beginCell()
            .storeUint(1, 8)
            .storeStringTail('https://agent-passport.example.com/collection.json')
            .endCell();

        registry = blockchain.openContract(
            await AgentRegistry.fromInit(deployer.address, collectionContent)
        );

        await registry.send(deployer.getSender(), { value: toNano('0.1') }, {
            $$type: 'Deploy', queryId: 0n,
        });

        await registry.send(deployer.getSender(), { value: toNano('0.2') }, {
            $$type: 'MintPassport', queryId: 1n,
            owner: agentOwner.address,
            capabilities: 'translation,summarization',
            endpoint: 'https://myagent.com/api',
            metadataUrl: 'https://myagent.com/metadata.json',
        });

        const passportAddress = await registry.getGetNftAddressByIndex(0n);
        passport = blockchain.openContract(AgentPassport.fromAddress(passportAddress));
    });

    it('should reject transfer (SBT is non-transferable)', async () => {
        const recipient = await blockchain.treasury('recipient');

        const result = await passport.send(
            agentOwner.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'Transfer',
                queryId: 1n,
                newOwner: recipient.address,
                responseDestination: agentOwner.address,
                customPayload: null,
                forwardAmount: 0n,
                forwardPayload: beginCell().endCell().asSlice(),
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: agentOwner.address,
            to: passport.address,
            success: false,
        });
    });

    it('should allow owner to update endpoint', async () => {
        await passport.send(agentOwner.getSender(), { value: toNano('0.05') }, {
            $$type: 'UpdateEndpoint', queryId: 1n,
            newEndpoint: 'https://myagent-v2.com/api',
        });

        const data = await passport.getGetPassportData();
        expect(data.endpoint).toBe('https://myagent-v2.com/api');
    });

    it('should reject endpoint update from non-owner', async () => {
        const attacker = await blockchain.treasury('attacker');

        const result = await passport.send(attacker.getSender(), { value: toNano('0.05') }, {
            $$type: 'UpdateEndpoint', queryId: 1n,
            newEndpoint: 'https://evil.com',
        });

        expect(result.transactions).toHaveTransaction({
            from: attacker.address,
            to: passport.address,
            success: false,
        });
    });

    it('should return correct authority address (registry)', async () => {
        const authority = await passport.getGetAuthorityAddress();
        expect(authority.equals(registry.address)).toBe(true);
    });

    it('should revoke passport (authority only)', async () => {
        const revokedBefore = await passport.getGetRevokedTime();
        expect(revokedBefore).toBe(0n);

        blockchain.now = Math.floor(Date.now() / 1000) + 100;
        const result = await passport.send(
            blockchain.sender(registry.address),
            { value: toNano('0.05') },
            { $$type: 'Revoke', queryId: 1n }
        );

        expect(result.transactions).toHaveTransaction({
            from: registry.address,
            to: passport.address,
            success: true,
        });

        const revokedAfter = await passport.getGetRevokedTime();
        expect(revokedAfter).toBeGreaterThan(0n);
    });

    it('should reject revoke from non-authority', async () => {
        const attacker = await blockchain.treasury('attacker');

        const result = await passport.send(attacker.getSender(), { value: toNano('0.05') }, {
            $$type: 'Revoke', queryId: 1n,
        });

        expect(result.transactions).toHaveTransaction({
            from: attacker.address,
            to: passport.address,
            success: false,
        });
    });

    it('should allow owner to destroy (burn) SBT', async () => {
        const result = await passport.send(agentOwner.getSender(), { value: toNano('0.05') }, {
            $$type: 'Destroy', queryId: 1n,
        });

        expect(result.transactions).toHaveTransaction({
            from: agentOwner.address,
            to: passport.address,
            success: true,
        });
    });

    it('should handle prove_ownership (owner only)', async () => {
        const verifier = await blockchain.treasury('verifier');

        const result = await passport.send(agentOwner.getSender(), { value: toNano('0.05') }, {
            $$type: 'ProveOwnership',
            queryId: 1n,
            dest: verifier.address,
            forwardPayload: beginCell().storeUint(123, 32).endCell(),
            withContent: false,
        });

        expect(result.transactions).toHaveTransaction({
            from: passport.address,
            to: verifier.address,
            success: true,
        });
    });

    it('should handle request_owner (anyone)', async () => {
        const requester = await blockchain.treasury('requester');
        const dest = await blockchain.treasury('dest');

        const result = await passport.send(requester.getSender(), { value: toNano('0.05') }, {
            $$type: 'RequestOwner',
            queryId: 1n,
            dest: dest.address,
            forwardPayload: beginCell().endCell(),
            withContent: false,
        });

        expect(result.transactions).toHaveTransaction({
            from: passport.address,
            to: dest.address,
            success: true,
        });
    });
});
