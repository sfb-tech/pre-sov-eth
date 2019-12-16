const { BN, constants, balance, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const SOVToken = artifacts.require("SOVToken");

contract('SOVToken', (accounts) => {
  it('approve self to whitelist', async () => {
    const SOVTokenInstance = await SOVToken.deployed();
    SOVTokenInstance.addAdmin.sendTransaction(accounts[0]);

    let onWhitelist = await SOVTokenInstance.whitelist.call(accounts[0]);
    assert.equal(onWhitelist, false, "Owner address was already on the whitelist");

    await SOVTokenInstance.addToWhiteList.sendTransaction(accounts[0]);
    
    onWhitelist = await SOVTokenInstance.whitelist.call(accounts[0]);
    assert.equal(onWhitelist, true, "Owner address was not added to the whitelist");
  })

  it('approve another account to whitelist', async () => {
    const SOVTokenInstance = await SOVToken.deployed();
    SOVTokenInstance.addAdmin.sendTransaction(accounts[0]);

    let onWhitelist = await SOVTokenInstance.whitelist.call(accounts[1]);
    assert.equal(onWhitelist, false, "Another address was already on the whitelist");

    await SOVTokenInstance.addToWhiteList.sendTransaction(accounts[0]);
    
    onWhitelist = await SOVTokenInstance.whitelist.call(accounts[0]);
    assert.equal(onWhitelist, true, "Another address was not added to the whitelist");
  })

  it('tries to send SOVToken to non-whitelisted address', async () => {
    const SOVTokenInstance = await SOVToken.deployed();
    SOVTokenInstance.addAdmin.sendTransaction(accounts[0]);
    // whitelist owner
    await SOVTokenInstance.addToWhiteList.sendTransaction(accounts[0]);
    // mint 100 tokens to owner address
    await SOVTokenInstance.mint.sendTransaction(accounts[0], (100 * (10 ** 4)));
    // send SOVToken to non-approved address
    // tries to send token to non-whitelisted address, expects an error
    await expectRevert(SOVTokenInstance.transfer(accounts[1], (1 * (10 ** 4)), {from: accounts[0]}), "to address not on whitelist");
  })

  it('tries to send SOVToken from non-whitelisted address', async () => {
    const SOVTokenInstance = await SOVToken.deployed();
    SOVTokenInstance.addAdmin.sendTransaction(accounts[0]);
    // whitelist address 1
    await SOVTokenInstance.addToWhiteList.sendTransaction(accounts[1]);
    // mint 100 tokens to address 2
    await SOVTokenInstance.mint.sendTransaction(accounts[2], (100 * (10 ** 4)));
    // send SOVToken from non-approved address
    // tries to send token from non-whitelisted address, expects an error
    await expectRevert(SOVTokenInstance.transfer(accounts[1], (1 * (10 ** 4)), {from: accounts[2]}), "from address not on whitelist");
  })

  it('sends SOVToken to whitelisted address', async () => {
    const SOVTokenInstance = await SOVToken.deployed();
    SOVTokenInstance.addAdmin.sendTransaction(accounts[0]);
    // whitelist owner and another address
    await SOVTokenInstance.addToWhiteList.sendTransaction(accounts[0]);
    await SOVTokenInstance.addToWhiteList.sendTransaction(accounts[1]);
    // mint 100 tokens to owner address
    await SOVTokenInstance.mint.sendTransaction(accounts[0], (100 * (10 ** 4)));
    const initOwnerBalance = await SOVTokenInstance.balanceOf.call(accounts[0]);
    const initAddressBalance = await SOVTokenInstance.balanceOf.call(accounts[1]);
    // console.log('owner balance: ' + initOwnerBalance / 1E4)
    // console.log('address balance: ' + initAddressBalance / 1E4)
    // send 1 SOVToken to approved address
    await SOVTokenInstance.transfer(accounts[1], (1 * (10 ** 4)), {from: accounts[0]});
    // console.log('sending one token from ' + accounts[0] + ' to ' + accounts[1])
    let ownerBalance = await SOVTokenInstance.balanceOf.call(accounts[0]);
    let addressBalance = await SOVTokenInstance.balanceOf.call(accounts[1]);
    // console.log('owner balance: ' + ownerBalance / 1E4)
    // console.log('address balance: ' + addressBalance / 1E4)
    
    assert.equal((ownerBalance.toNumber() / 1E4), (initOwnerBalance.toNumber() / 1E4) - 1, "Owner balance was not deducted properly");
    assert.equal((addressBalance.toNumber() / 1E4), (initAddressBalance.toNumber() / 1E4) + 1, "Address balance was not incremented properly");
  })
});
