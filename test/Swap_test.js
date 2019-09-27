
const Swap = artifacts.require('./Swap.sol');

const expectThrow = require('./utils').expectThrow;

contract('Swap', function (accounts) {
    const owner = accounts[0];
    const alice = accounts[1];
    const bob = accounts[2];
    const charlie = accounts[3];
    const dan = accounts[4];
    const token = accounts[5];

    beforeEach(async function() {
        this.swap = await Swap.new();
    });
    
    it('initial nonce', async function () {
        const nonce = await this.swap.nonce();
        
        assert.equal(nonce, 0);
    });
    
    it('open send', async function () {
        const result = await this.swap.openSend(charlie, token, 1000, { from: alice });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Send');
        assert.equal(log.args.token, token);
        assert.equal(log.args.amount, 1000);
        assert.equal(log.args.sender, alice);
        assert.equal(log.args.receiver, charlie);
        assert.equal(log.args.nonce, 0);
        
        const nonce = await this.swap.nonce();
        
        assert.equal(nonce, 1);
        
        const data = await this.swap.sends(log.args.id);
        
        assert.equal(data.sender, alice);
        assert.equal(data.receiver, charlie);
        assert.equal(data.token, token);
        assert.equal(data.amount, 1000);
        assert.equal(data.nonce, 0);
    });
    
    it('cannot send zero value', async function () {
        await expectThrow(this.swap.openSend(charlie, token, 0, { from: alice }));

        const nonce = await this.swap.nonce();
        
        assert.equal(nonce, 0);
    });
    
    it('do proposal', async function () {
        const result = await this.swap.doProposal(dan, '0x01', token, 1000, { from: bob });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Proposal');
        assert.equal(log.args.sendID, '0x0100000000000000000000000000000000000000000000000000000000000000');
        assert.equal(log.args.proposer, bob);
        assert.equal(log.args.executor, dan);
        assert.equal(log.args.token, token);
        assert.equal(log.args.amount, 1000);
        
        const data = await this.swap.proposals(log.args.id);
        
        assert.equal(data.sendID, '0x0100000000000000000000000000000000000000000000000000000000000000');
        assert.equal(data.proposer, bob);
        assert.equal(data.executor, dan);
        assert.equal(data.token, token);
        assert.equal(data.amount, 1000);
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('cannot do proposal with zero value', async function () {
        await expectThrow(this.swap.doProposal('0x01', token, 0, { from: bob }));
    });
});

