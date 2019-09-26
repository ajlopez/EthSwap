pragma solidity >=0.4.21 <0.6.0;

contract Swap {
    uint public nonce;
    
    struct SendData {
        address sender;
        uint nonce;
        address token;
        uint amount;
    }
    
    struct ProposalData {
        address proposer;
        bytes32 sendID;
        address token;
        uint amount;
        bytes32 hash;
    }
    
    mapping (bytes32 => SendData) public sends;
    mapping (bytes32 => ProposalData) public proposals;
    
    event Send(bytes32 indexed id, address indexed sender, uint nonce, address indexed token, uint amount);
    event Proposal(bytes32 indexed id, bytes32 indexed sendID, address indexed proposer, address token, uint amount);
    
    function openSend(address token, uint amount) public returns (bytes32) {
        require(amount > 0);
        
        bytes32 id = keccak256(abi.encodePacked(msg.sender, nonce, token, amount));
        
        sends[id] = SendData(msg.sender, nonce, token, amount);
        
        emit Send(id, msg.sender, nonce, token, amount);
        
        nonce++;
        
        return id;
    }
    
    function doProposal(bytes32 sendID, address token, uint amount) public returns (bytes32) {
        require(amount > 0);
        
        bytes32 id = keccak256(abi.encodePacked(msg.sender, sendID, token, amount));
        
        proposals[id] = ProposalData(msg.sender, sendID, token, amount, 0);
        
        emit Proposal(id, sendID, msg.sender, token, amount);
        
        return id;
    }
}

