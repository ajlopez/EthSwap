
const Swap = artifacts.require('./Swap.sol');

contract('Swap', function (accounts) {
    beforeEach(async function() {
        this.swap = await Swap.new();
    });
    
    it('initial nonce', async function () {
        const nonce = await this.swap.nonce();
        
        assert.equal(nonce, 0);
    });
});