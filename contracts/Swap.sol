pragma solidity >=0.4.21 <0.6.0;

contract Swap {
    uint public nonce;
    
    struct OperationData {
        address sender;
        address receiver;
        address token;
        uint amount;
        uint nonce;
    }
    
    struct DealData {
        bytes32 proposalID;
        address executor;
        bytes32 hash;
        bool executed;
    }
    
    struct ProposalData {
        bytes32 operationID;
        address proposer;
        address executor;
        address token;
        uint amount;
        bytes32 hash;
    }
    
    mapping (bytes32 => OperationData) public operations;
    mapping (bytes32 => DealData) public deals;
    mapping (bytes32 => ProposalData) public proposals;
    
    event Operation(bytes32 indexed operationID, address indexed sender, address receiver, address indexed token, uint amount, uint nonce);
    event Proposal(bytes32 indexed proposalID, bytes32 indexed operationID, address indexed proposer, address executor, address token, uint amount);
    event Deal(bytes32 indexed operationID, bytes32 indexed proposalID, address indexed executor, bytes32 hash);
    event DealExecution(bytes32 indexed operationID, address indexed executor, bytes32 hash, bytes32 preimage);
    event DealClose(bytes32 indexed operationID, bytes32 indexed proposalID, address indexed receiver, bytes32 hash, bytes32 preimage);
    event Confirmation(bytes32 indexed proposalID, bytes32 hash);
    
    function openOperation(address receiver, address token, uint amount) public returns (bytes32) {
        require(amount > 0);
        
        bytes32 id = keccak256(abi.encodePacked(msg.sender, receiver, token, amount, nonce));
        
        operations[id] = OperationData(msg.sender, receiver, token, amount, nonce);
        
        emit Operation(id, msg.sender, receiver, token, amount, nonce);
        
        nonce++;
        
        return id;
    }
    
    function makeProposal(bytes32 operationID, address executor, address token, uint amount) public returns (bytes32) {
        require(amount > 0);
        
        bytes32 id = keccak256(abi.encodePacked(msg.sender, executor, operationID, token, amount));
        
        proposals[id] = ProposalData(operationID, msg.sender, executor, token, amount, 0);
        
        emit Proposal(id, operationID, msg.sender, executor, token, amount);
        
        return id;
    }
    
    function acceptDeal(bytes32 operationID, bytes32 proposalID, address executor, bytes32 hash) public {
        require(operations[operationID].sender == msg.sender);
        require(deals[operationID].executor == address(0));
        
        deals[operationID].proposalID = proposalID;
        deals[operationID].executor = executor;
        deals[operationID].hash = hash;
        
        emit Deal(operationID, proposalID, executor, hash);
    }
    
    function executeDeal(bytes32 operationID, bytes32 preimage) public {
        require(deals[operationID].executor == msg.sender);
        require(deals[operationID].executed == false);
        require(deals[operationID].hash == keccak256(abi.encode(preimage)));
        
        deals[operationID].executed = true;
        
        emit DealExecution(operationID, msg.sender, deals[operationID].hash, preimage);
    }
    
    function confirmDeal(bytes32 proposalID, bytes32 hash) public {
        require(proposals[proposalID].proposer == msg.sender);
        require(proposals[proposalID].hash == bytes32(0));
        
        proposals[proposalID].hash = hash;
        
        emit Confirmation(proposalID, hash);
    }
    
    function closeDeal(bytes32 proposalID, bytes32 preimage) public {
        ProposalData storage proposal = proposals[proposalID];
        
        emit DealClose(proposal.operationID, proposalID, msg.sender, proposal.hash, preimage);
    }
}

