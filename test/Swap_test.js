
const Swap = artifacts.require('./Swap.sol');

const expectThrow = require('./utils').expectThrow;
const randomHash = require('./utils').randomHash;

contract('Swap', function (accounts) {
    const owner = accounts[0];
    const alice = accounts[1];
    const bob = accounts[2];
    const charlie = accounts[3];
    const dan = accounts[4];
    const token = accounts[5];

    const preimage = randomHash();
    const hash = web3.utils.sha3(preimage);

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
        
        const data = await this.swap.operations(log.args.operationID);
        
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
        const result = await this.swap.makeProposal('0x01', dan, token, 1000, { from: bob });
        
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
        
        const data = await this.swap.proposals(log.args.proposalID);
        
        assert.equal(data.operationID, '0x0100000000000000000000000000000000000000000000000000000000000000');
        assert.equal(data.proposer, bob);
        assert.equal(data.executor, dan);
        assert.equal(data.token, token);
        assert.equal(data.amount, 1000);
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('cannot make proposal with zero value', async function () {
        await expectThrow(this.swap.makeProposal('0x01', dan, token, 0, { from: bob }));
    });
    
    it('accept deal', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.operationID;
        
        const result = await this.swap.acceptDeal(id, '0x01', dan, '0x02', { from: alice });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Deal');
        assert.equal(log.args.operationID, id);
        assert.equal(log.args.proposalID, '0x0100000000000000000000000000000000000000000000000000000000000000');
        assert.equal(log.args.executor, dan);
        assert.equal(log.args.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
        
        const data = await this.swap.deals(log.args.operationID);
        
        assert.equal(data.proposalID, '0x0100000000000000000000000000000000000000000000000000000000000000');
        assert.equal(data.executor, dan);
        assert.equal(data.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('cannot accept deal twice', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.operationID;
        
        const result = await this.swap.acceptDeal(id, '0x01', dan, '0x02', { from: alice });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Deal');
        assert.equal(log.args.operationID, id);
        assert.equal(log.args.proposalID, '0x0100000000000000000000000000000000000000000000000000000000000000');
        assert.equal(log.args.executor, dan);
        assert.equal(log.args.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');

        await expectThrow(this.swap.acceptDeal(id, '0x01', dan, '0x02', { from: alice }));
        await expectThrow(this.swap.acceptDeal(id, '0x04', charlie, '0x03', { from: alice }));
        
        const data = await this.swap.deals(log.args.operationID);
        
        assert.equal(data.proposalID, '0x0100000000000000000000000000000000000000000000000000000000000000');
        assert.equal(data.executor, dan);
        assert.equal(data.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('cannot accept deal on non existent operation', async function () {
        const id = '0x01';
        
        await expectThrow(this.swap.acceptDeal(id, '0x01', dan, '0x02', { from: alice }));
        
        const data = await this.swap.deals(id);
        
        assert.equal(data.proposalID, '0x0000000000000000000000000000000000000000000000000000000000000000');
        assert.equal(data.executor, 0);
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('only operation sender can accept a deal', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.operationID;
        
        await expectThrow(this.swap.acceptDeal(id, '0x01', dan, '0x02', { from: bob }));
        
        const data = await this.swap.deals(id);
        
        assert.equal(data.proposalID, '0x0000000000000000000000000000000000000000000000000000000000000000');
        assert.equal(data.executor, 0);
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('confirm deal', async function () {
        const resultprop = await this.swap.makeProposal('0x01', dan, token, 1000, { from: bob });
        
        const id = resultprop.logs[0].args.proposalID;
        
        const result = await this.swap.confirmDeal(id, '0x02', { from: bob });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Confirmation');
        assert.equal(log.args.proposalID, id);
        assert.equal(log.args.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
        
        const data = await this.swap.proposals(id);
        
        assert.equal(data.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('cannot confirm deal twice or change hash', async function () {
        const resultprop = await this.swap.makeProposal('0x01', dan, token, 1000, { from: bob });
        
        const id = resultprop.logs[0].args.proposalID;
        
        const result = await this.swap.confirmDeal(id, '0x02', { from: bob });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'Confirmation');
        assert.equal(log.args.proposalID, id);
        assert.equal(log.args.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
        
        await expectThrow(this.swap.confirmDeal(id, '0x02', { from: bob }));
        await expectThrow(this.swap.confirmDeal(id, '0x01', { from: bob }));
        
        const data = await this.swap.proposals(id);
        
        assert.equal(data.hash, '0x0200000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('only proposer can confirm deal', async function () {
        const resultprop = await this.swap.makeProposal('0x01', dan, token, 1000, { from: bob });
        
        const id = resultprop.logs[0].args.proposalID;
        
        await expectThrow(this.swap.confirmDeal(id, '0x02', { from: alice }));
        
        const data = await this.swap.proposals(id);
        
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('cannot confirm deal over non existent proposal', async function () {
        await expectThrow(this.swap.confirmDeal('0x01', '0x02', { from: bob }));
        
        const data = await this.swap.proposals('0x01');
        
        assert.equal(data.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    });
    
    it('execute deal', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.operationID;
        
        await this.swap.acceptDeal(id, '0x01', dan, hash, { from: alice });
        
        const result = await this.swap.executeDeal(id, preimage, { from: dan });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'DealExecution');
        assert.equal(log.args.operationID, id);
        assert.equal(log.args.hash, hash);
        assert.equal(log.args.preimage, '0x' + preimage.toString('hex'));
        
        const data = await this.swap.deals(id);
        
        assert.ok(data.executed);
    });
    
    it('cannot execute deal with invalid preimage', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.operationID;
        
        await this.swap.acceptDeal(id, '0x01', dan, hash, { from: alice });
        
        await expectThrow(this.swap.executeDeal(id, '0x03', { from: dan }));
        
        const data = await this.swap.deals(id);
        
        assert.ok(!data.executed);
    });
    
    it('cannot execute deal twice', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.operationID;
        
        await this.swap.acceptDeal(id, '0x01', dan, hash, { from: alice });
        
        await this.swap.executeDeal(id, preimage, { from: dan });
        await expectThrow(this.swap.executeDeal(id, preimage, { from: dan }));
        
        const data = await this.swap.deals(id);
        
        assert.ok(data.executed);
    });

    it('only accepted executor can execute deal', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.operationID;
        
        await this.swap.acceptDeal(id, '0x01', dan, hash, { from: alice });
        
        await expectThrow(this.swap.executeDeal(id, preimage, { from: charlie }));
        
        const data = await this.swap.deals(id);
        
        assert.ok(!data.executed);
    });
    
    it('cannot execute deal over not accepted operation deal', async function () {
        const resultop = await this.swap.openOperation(charlie, token, 1000, { from: alice });
        
        const id = resultop.logs[0].args.operationID;
        
        await expectThrow(this.swap.executeDeal(id, preimage, { from: charlie }));
        
        const data = await this.swap.deals(id);
        
        assert.ok(!data.executed);
    });
    
    it('cannot execute deal over non existent operation', async function () {
        const id = '0x01';
        
        await expectThrow(this.swap.executeDeal(id, preimage, { from: charlie }));
        
        const data = await this.swap.deals(id);
        
        assert.ok(!data.executed);
    });
    
    it('close deal', async function () {
        const id = '0x01';
        
        const result = await this.swap.closeDeal(id, '0x02', { from: bob });
        
        assert.ok(result);
        assert.ok(result.logs);
        assert.equal(result.logs.length, 1);
        
        const log = result.logs[0];
        
        assert.equal(log.event, 'DealClose');
        assert.equal(log.args.operationID, '0x0000000000000000000000000000000000000000000000000000000000000000');
        assert.equal(log.args.proposalID, '0x0100000000000000000000000000000000000000000000000000000000000000');
        assert.equal(log.args.hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
        assert.equal(log.args.preimage, '0x0200000000000000000000000000000000000000000000000000000000000000');
    });
});

