pragma solidity >=0.4.21 <0.6.0;

contract Swap {
    uint public nonce;
    
    struct SendData {
        address sender;
        uint nonce;
        address token;
        uint amount;
    }
    
    mapping (bytes32 => SendData) public sends;
    
    event Send(bytes32 indexed id, address indexed sender, uint nonce, address indexed token, uint amount);
    
    function openSend(address token, uint amount) public returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(msg.sender, nonce, token, amount));
        
        sends[id] = SendData(msg.sender, nonce, token, amount);
        
        emit Send(id, msg.sender, nonce, token, amount);
        
        nonce++;
        
        return id;
    }
}

