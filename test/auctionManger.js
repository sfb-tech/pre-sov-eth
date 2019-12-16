const { BN, constants, balance, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const AuctionManager = artifacts.require("AuctionManager");
const USDC = artifacts.require("USDC");
const Auction = artifacts.require("Auction");
const SOVToken = artifacts.require("SOVToken");

var toBN = web3.utils.toBN

contract('AuctionManager', (accounts) => {
  it('AuctionManager should spawn auction', async () => {
    const AuctionManagerInstance = await AuctionManager.deployed();
    // allow auction manager to mint
    const SOVTokenInstance = await SOVToken.deployed();
    SOVTokenInstance.addMinter.sendTransaction(AuctionManagerInstance.address);
    // allow auction manager to add auction instances to whitelist
    SOVTokenInstance.addAdmin.sendTransaction(accounts[0]);
    SOVTokenInstance.addAdmin.sendTransaction(AuctionManagerInstance.address);

    // create a new auction
    const auctionAddress = await AuctionManagerInstance.createAuction.call()
    await AuctionManagerInstance.createAuction()
    const AuctionInstance = await Auction.at(auctionAddress)
    
    // mint 10 usdc for account 1
    const USDCInstance = await USDC.deployed();
    await USDCInstance.mint.sendTransaction(accounts[1], toBN(30000).mul(toBN(1E18)));

    // get balance of usdc of account 1
    const usdcBalance = await USDCInstance.balanceOf.call(accounts[1]);
    assert.equal(usdcBalance / 1E18, 30000, "User doesn not have 10 USDC");

    // authorize our auction to send the coins
    await USDCInstance.approve.sendTransaction(auctionAddress, toBN(30000).mul(toBN(1E18)), {from: accounts[1]})

    // get balance of usdc of auction
    const initAuctionUSDCBalance = await USDCInstance.balanceOf.call(auctionAddress);
    assert.equal(initAuctionUSDCBalance / 1E18, 0, "Auction doesn not have 0 USDC");

    // whitelist the address before bidding! 
    await expectRevert(AuctionInstance.bid.sendTransaction(toBN(30000).mul(toBN(1E18)), {from: accounts[1]}), "Address is not on whitelist");
    await SOVTokenInstance.addToWhiteList.sendTransaction(accounts[1]);

    // send that usdc to auction 
    await AuctionInstance.bid.sendTransaction(toBN(30000).mul(toBN(1E18)), {from: accounts[1]})
    
    // get balance of usdc of auction
    const auctionUSDCBalance = await USDCInstance.balanceOf.call(auctionAddress);
    assert.equal(auctionUSDCBalance / 1E18, 30000, "Auction doesn not have 10 USDC");

    // get balance of usdc of account 1
    const accountUSDCBalance = await USDCInstance.balanceOf.call(accounts[1]);
    assert.equal(accountUSDCBalance / 1E18, 0, "User doesn not have 0 USDC");
    
    // get balance of account 1 on auction
    const accountBalanceOnAuction = await AuctionInstance.balanceOf.call(accounts[1]);
    assert.equal(accountBalanceOnAuction / 1E18, 30000, "User doesn not have 0 USDC");

    // mint some coins for account 2 
    await USDCInstance.mint.sendTransaction(accounts[2], toBN(70000).mul(toBN(1E18)));
    // whitelist address account 2
    await SOVTokenInstance.addToWhiteList.sendTransaction(accounts[2]);
    // authorize and send coins to contract
    await USDCInstance.approve.sendTransaction(auctionAddress, toBN(70000).mul(toBN(1E18)), {from: accounts[2]})

    await AuctionInstance.bid.sendTransaction(toBN(70000).mul(toBN(1E18)), {from: accounts[2]})

    const allowance = await USDCInstance.allowance.call(accounts[2], auctionAddress, {from: accounts[2]});
    // console.log('allowance, ' + allowance)

    // get balance of sov of auction
    const auctionSOVBalance = await SOVTokenInstance.balanceOf.call(auctionAddress);
    assert.equal(auctionSOVBalance / 1E4, 100000, "Auction doesn not have 60000 SOV");

    // trigger the payout of the contract.
    await AuctionInstance.payout.sendTransaction();
    
    const accountOneSOVBalance = await SOVTokenInstance.balanceOf.call(accounts[1]);
    assert.equal(accountOneSOVBalance / 1E4, toBN(100000).mul(toBN(3/10)), "account 1 doesn not have 17142.8571 SOV");

    const accountTwoSOVBalance = await SOVTokenInstance.balanceOf.call(accounts[2]);
    assert.equal(accountTwoSOVBalance / 1E4, toBN(100000).mul(toBN(7/10)), "account 1 doesn not have 42857.1428 SOV");
  });
});

// test --show-events