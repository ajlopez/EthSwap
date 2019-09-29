
async function expectThrow (promise) {
  try {
    await promise;
  } catch (error) {
      return;
  }
  
  assert.fail('Expected throw not received');
}

function generateRandomHexaByte() {
    let n = Math.floor(Math.random() * 255).toString(16);
    
    while (n.length < 2)
        n = '0' + n;
    
    return n;
}

function generateRandomHash() {
    let keytxt = '';
    
    for (let k = 0; k < 32; k++)
        keytxt += generateRandomHexaByte();
    
    return new Buffer(keytxt, 'hex');
}

module.exports = {
    expectThrow: expectThrow,
    randomHash: generateRandomHash
}

