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
        address executor;
        bytes32 hash;
    }
    
    struct ProposalData {
        address proposer;
        address executor;
        bytes32 operationID;
        address token;
        uint amount;
        bytes32 hash;
    }
    
    mapping (bytes32 => OperationData) public operations;
    mapping (bytes32 => ProposalData) public proposals;
    
    event Operation(bytes32 indexed id, address indexed sender, address receiver, address indexed token, uint amount, uint nonce);
    event Proposal(bytes32 indexed id, bytes32 indexed sendID, address indexed proposer, address executor, address token, uint amount);
    
    function openOperation(address receiver, address token, uint amount) public returns (bytes32) {
        require(amount > 0);
        
        bytes32 id = keccak256(abi.encodePacked(msg.sender, receiver, token, amount, nonce));
        
        operations[id] = OperationData(msg.sender, receiver, token, amount, nonce);
        
        emit Operation(id, msg.sender, receiver, token, amount, nonce);
        
        nonce++;
        
        return id;
    }
    
    function makeProposal(address executor, bytes32 sendID, address token, uint amount) public returns (bytes32) {
        require(amount > 0);
        
        bytes32 id = keccak256(abi.encodePacked(msg.sender, executor, sendID, token, amount));
        
        proposals[id] = ProposalData(msg.sender, executor, sendID, token, amount, 0);
        
        emit Proposal(id, sendID, msg.sender, executor, token, amount);
        
        return id;
    }
}

