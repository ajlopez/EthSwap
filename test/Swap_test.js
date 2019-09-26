
const Swap = artifacts.require('./Swap.sol');

contract('Swap', function (accounts) {
    const owner = accounts[0];
    const alice = accounts[1];
    const bob = accounts[2];
    const token = accounts[3];

    beforeEach(async function() {
        this.swap = await Swap.new();
    });
    
    it('initial nonce', async function () {
        const nonce = await this.swap.nonce();
        
        assert.equal(nonce, 0);
    });
    
    it('open send', async function () {
        const result = await this.swap.openSend(token, 1000, bob, { from: alice });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Send');
        assert.equal(log.args.nonce, 0);
        assert.equal(log.args.token, token);
        assert.equal(log.args.amount, 1000);
        assert.equal(log.args.receiver, bob);
        
        const nonce = await this.swap.nonce();
        
        assert.equal(nonce, 1);
    });
});