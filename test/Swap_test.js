
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
    
    it('open operation', async function () {
        const result = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Operation');
        assert.equal(log.args.token, token);
        assert.equal(log.args.amount, 1000);
        assert.equal(log.args.sender, alice);
        assert.equal(log.args.receiver, charlie);
        assert.equal(log.args.nonce, 0);
        
        const nonce = await this.swap.nonce();
        
        assert.equal(nonce, 1);
        
        const data = await this.swap.operations(log.args.id);
        
        assert.equal(data.sender, alice);
        assert.equal(data.receiver, charlie);
        assert.equal(data.token, token);
        assert.equal(data.amount, 1000);
        assert.equal(data.nonce, 0);
    });
    
    it('cannot open operation with zero value', async function () {
        await expectThrow(this.swap.openOperation(charlie, token, 0, { from: alice }));

        const nonce = await this.swap.nonce();
        
        assert.equal(nonce, 0);
    });
    
    it('make proposal', async function () {
        const result = await this.swap.makeProposal(dan, '0x01', token, 1000, { from: bob });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Proposal');
        assert.equal(log.args.operationID, '0x0100000000000000000000000000000000000000000000000000000000000000');
        assert.equal(log.args.proposer, bob);
        assert.equal(log.args.executor, dan);
        assert.equal(log.args.token, token);
        assert.equal(log.args.amount, 1000);
        
        const data = await this.swap.proposals(log.args.id);
        
        assert.equal(data.operationID, '0x0100000000000000000000000000000000000000000000000000000000000000');
        assert.equal(data.proposer, bob);
        assert.equal(data.executor, dan);
        assert.equal(data.token, token);
        assert.equal(data.amount, 1000);
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('cannot make proposal with zero value', async function () {
        await expectThrow(this.swap.makeProposal(dan, '0x01', token, 0, { from: bob }));
    });
    
    it('accept deal', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.id;
        
        const result = await this.swap.acceptDeal(id, dan, '0x02', { from: alice });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Deal');
        assert.equal(log.args.id, id);
        assert.equal(log.args.executor, dan);
        assert.equal(log.args.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
        
        const data = await this.swap.deals(log.args.id);
        
        assert.equal(data.executor, dan);
        assert.equal(data.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('cannot accept deal twice', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.id;
        
        const result = await this.swap.acceptDeal(id, dan, '0x02', { from: alice });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Deal');
        assert.equal(log.args.id, id);
        assert.equal(log.args.executor, dan);
        assert.equal(log.args.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');

        await expectThrow(this.swap.acceptDeal(id, dan, '0x02', { from: alice }));
        await expectThrow(this.swap.acceptDeal(id, charlie, '0x03', { from: alice }));
        
        const data = await this.swap.deals(log.args.id);
        
        assert.equal(data.executor, dan);
        assert.equal(data.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('cannot accept deal on non existent operation', async function () {
        const id = '0x01';
        
        await expectThrow(this.swap.acceptDeal(id, dan, '0x02', { from: alice }));
        
        const data = await this.swap.deals(id);
        
        assert.equal(data.executor, 0);
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('only operation send can accept a deal', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.id;
        
        await expectThrow(this.swap.acceptDeal(id, dan, '0x02', { from: bob }));
        
        const data = await this.swap.deals(id);
        
        assert.equal(data.executor, 0);
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('confirm deal', async function () {
        const resultprop = await this.swap.makeProposal(dan, '0x01', token, 1000, { from: bob });
        
        const id = resultprop.logs[0].args.id;
        
        const result = await this.swap.confirmDeal(id, '0x02', { from: bob });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Confirmation');
        assert.equal(log.args.id, id);
        assert.equal(log.args.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
        
        const data = await this.swap.proposals(id);
        
        assert.equal(data.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('only proposer can confirm deal', async function () {
        const resultprop = await this.swap.makeProposal(dan, '0x01', token, 1000, { from: bob });
        
        const id = resultprop.logs[0].args.id;
        
        await expectThrow(this.swap.confirmDeal(id, '0x02', { from: alice }));
        
        const data = await this.swap.proposals(id);
        
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('cannot confirm deal over non existent proposal', async function () {
        await expectThrow(this.swap.confirmDeal('0x01', '0x02', { from: bob }));
        
        const data = await this.swap.proposals('0x01');
        
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
});

