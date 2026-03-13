import "@stdlib/deploy";
import "@stdlib/ownable";
import "./agent_passport";

// ===== Messages =====

message MintPassport {
    queryId: Int as uint64;
    owner: Address;
    capabilities: String;
    endpoint: String;
    metadataUrl: String;
}

message BatchIncrementTxCount {
    queryId: Int as uint64;
    agentIndex: Int as uint64;
}

message BatchUpdateCapabilities {
    queryId: Int as uint64;
    agentIndex: Int as uint64;
    newCapabilities: String;
}

// ===== Structs =====

struct CollectionData {
    nextItemIndex: Int;
    content: Cell;
    owner: Address;
}

// ===== Contract =====

contract AgentRegistry with Deployable, Ownable {
    owner: Address;
    nextItemIndex: Int as uint64;
    collectionContent: Cell;

    init(owner: Address, collectionContent: Cell) {
        self.owner = owner;
        self.nextItemIndex = 0;
        self.collectionContent = collectionContent;
    }

    // Mint a new Agent Passport SBT
    receive(msg: MintPassport) {
        self.requireOwner();

        let index: Int = self.nextItemIndex;
        let initData: StateInit = initOf AgentPassport(myAddress(), index);
        let itemAddress: Address = contractAddress(initData);

        // Build individual content cell (off-chain tag + URL)
        let contentCell: Cell = beginCell()
            .storeUint(1, 8)
            .storeSlice(msg.metadataUrl.asSlice())
            .endCell();

        // Deploy the SBT item
        send(SendParameters{
            to: itemAddress,
            value: ton("0.05"),
            mode: SendPayGasSeparately,
            code: initData.code,
            data: initData.data,
            body: SetupPassport{
                owner: msg.owner,
                authority: myAddress(),
                capabilities: msg.capabilities,
                endpoint: msg.endpoint,
                metadataUrl: msg.metadataUrl,
                content: contentCell,
            }.toCell(),
        });

        self.nextItemIndex += 1;
    }

    // Forward increment to a specific passport
    receive(msg: BatchIncrementTxCount) {
        self.requireOwner();

        let initData: StateInit = initOf AgentPassport(myAddress(), msg.agentIndex);
        let itemAddress: Address = contractAddress(initData);

        send(SendParameters{
            to: itemAddress,
            value: 0,
            mode: SendRemainingValue,
            body: IncrementTxCount{
                queryId: msg.queryId,
            }.toCell(),
        });
    }

    // Forward capability update to a specific passport
    receive(msg: BatchUpdateCapabilities) {
        self.requireOwner();

        let initData: StateInit = initOf AgentPassport(myAddress(), msg.agentIndex);
        let itemAddress: Address = contractAddress(initData);

        send(SendParameters{
            to: itemAddress,
            value: 0,
            mode: SendRemainingValue,
            body: UpdateCapabilities{
                queryId: msg.queryId,
                newCapabilities: msg.newCapabilities,
            }.toCell(),
        });
    }

    // ===== Getters =====

    // TEP-62: Collection data
    get fun get_collection_data(): CollectionData {
        return CollectionData{
            nextItemIndex: self.nextItemIndex,
            content: self.collectionContent,
            owner: self.owner,
        };
    }

    // TEP-62: Get NFT (passport) address by index
    get fun get_nft_address_by_index(index: Int): Address {
        let initData: StateInit = initOf AgentPassport(myAddress(), index);
        return contractAddress(initData);
    }

    // TEP-62: Get NFT content
    get fun get_nft_content(index: Int, individualContent: Cell): Cell {
        return individualContent;
    }

    // Custom: Total registered agents
    get fun get_agent_count(): Int {
        return self.nextItemIndex;
    }
}
