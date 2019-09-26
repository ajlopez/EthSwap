pragma solidity >=0.4.21 <0.6.0;

contract Swap {
    uint public nonce;
    
    struct SendData {
        uint nonce;
        address receiver;
        address token;
        uint amount;
    }
    
    mapping (bytes32 => SendData) public sends;
    
    event Send(bytes32 indexed id, uint nonce, address indexed receiver, address indexed token, uint amount);
    
    function openSend(address token, uint amount, address receiver) public returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(nonce, token, amount, receiver));
        
        sends[id] = SendData(nonce, receiver, token, amount);
        
        emit Send(id, nonce, receiver, token, amount);
        
        nonce++;
        
        return id;
    }
}

