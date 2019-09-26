
const Swap = artifacts.require('./Swap.sol');

const expectThrow = require('./utils').expectThrow;

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
        const result = await this.swap.openSend(token, 1000, { from: alice });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Send');
        assert.equal(log.args.nonce, 0);
        assert.equal(log.args.token, token);
        assert.equal(log.args.amount, 1000);
        assert.equal(log.args.sender, alice);
        
        const nonce = await this.swap.nonce();
        
        assert.equal(nonce, 1);
        
        const data = await this.swap.sends(log.args.id);
        
        assert.equal(data.sender, alice);
        assert.equal(data.token, token);
        assert.equal(data.amount, 1000);
        assert.equal(data.nonce, 0);
    });
    
    it('cannot send zero value', async function () {
        await expectThrow(this.swap.openSend(token, 0, { from: alice }));

        const nonce = await this.swap.nonce();
        
        assert.equal(nonce, 0);
    });
});