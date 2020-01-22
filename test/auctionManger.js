const { BN, constants, balance, expectEvent, expectRevert, time  } = require('@openzeppelin/test-helpers');
const helper = require("./helpers/truffleTestHelper");

const AuctionManager = artifacts.require("AuctionManager");
const USDC = artifacts.require("USDC");
const Auction = artifacts.require("Auction");
const SOVToken = artifacts.require("SOVToken");

var toBN = web3.utils.toBN

// deprecated in favor of open zepplin
// // wait five seconds
// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

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
    
    let totalRaised = await AuctionInstance.totalRaised.call()
    assert.equal(totalRaised.toString(), 0, "Auction starts off with more than 0 USDC");

    let pricePerTokenInTranche = await AuctionInstance.pricePerToken.call()
    assert.equal(pricePerTokenInTranche / 1E18, 0, "Auction starts off with price per token of 0");    

    // mint 30,000 usdc for account 1
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

    totalRaised = await AuctionInstance.totalRaised.call()
    assert.equal(totalRaised.toString(), 30000 * 1E18, "Auction should have 30000 USDC");

    pricePerTokenInTranche = await AuctionInstance.pricePerToken.call()
    assert.equal(pricePerTokenInTranche / 1E18, 0.5, "After a bid of 30000, auction has a price per token of $0.50");    
    
    // get balance of usdc of auction
    let auctionUSDCBalance = await USDCInstance.balanceOf.call(auctionAddress);
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
    // second bid 
    await AuctionInstance.bid.sendTransaction(toBN(70000).mul(toBN(1E18)), {from: accounts[2]})

    totalRaised = await AuctionInstance.totalRaised.call()
    assert.equal(totalRaised.toString(), 100000 * 1E18, "Auction should have 100000 USDC");

    pricePerTokenInTranche = await AuctionInstance.pricePerToken.call()
    assert.equal((pricePerTokenInTranche / 1E18).toFixed(2), 1.67, "After bids of 100,000, auction has a price per token of $1.67");    

    // const allowance = await USDCInstance.allowance.call(accounts[2], auctionAddress, {from: accounts[2]});
    // console.log('allowance, ' + allowance)

    // get balance of sov of auction
    let auctionSOVBalance = await SOVTokenInstance.balanceOf.call(auctionAddress);
    assert.equal(auctionSOVBalance / 1E4, 60000, "Auction doesn not have 60000 SOV");

    await time.increase(time.duration.hours(1));

    // trigger the payout of the contract.
    await AuctionInstance.payout.sendTransaction();

    totalRaised = await AuctionInstance.totalRaised.call()
    assert.equal(totalRaised.toString(), 100000 * 1E18, "Auction should still have 100000 USDC");

    auctionUSDCBalance = await USDCInstance.balanceOf.call(auctionAddress);
    assert.equal(auctionUSDCBalance / 1E18, 0, "Auction doesn not have 10 USDC");

    // trigger the payout of the contract.
    // expectRevert(AuctionInstance.payout.sendTransaction(), "if you try to payout on a non-zero-balance auction TWICE, it errors - because total raised != USDC balance of auciton")
    
    const accountOneSOVBalance = await SOVTokenInstance.balanceOf.call(accounts[1]);
    assert.equal(accountOneSOVBalance / 1E4, toBN(60000).mul(toBN(3)).div(toBN(10)), "account 1 doesn not have 18000 SOV");

    const accountTwoSOVBalance = await SOVTokenInstance.balanceOf.call(accounts[2]);
    assert.equal(accountTwoSOVBalance / 1E4, toBN(60000).mul(toBN(7)).div(toBN(10)), "account 1 doesn not have 42000 SOV");

    // check auction has no usdc no sov
    auctionUSDCBalance = await USDCInstance.balanceOf.call(auctionAddress);
    assert.equal(auctionUSDCBalance, 0, "Auction doesn not have 0 USDC");

    auctionSOVBalance = await SOVTokenInstance.balanceOf.call(auctionAddress);
    assert.equal(auctionSOVBalance, 0, "Auction doesn not have 0 SOV");

    // check auction manager has 100,000 usdc and 0 sov
    const auctionManagerUSDCBalance = await USDCInstance.balanceOf.call(AuctionManagerInstance.address);
    // note it returns 99,999 repeating instead of 100,000
    assert.equal((auctionManagerUSDCBalance / 1E18).toFixed(2), 100000, "Auction Manager doesn not have 100,000 USDC");

    const auctionManagerSOVBalance = await SOVTokenInstance.balanceOf.call(AuctionManagerInstance.address);
    assert.equal(auctionSOVBalance / 1E14, 0, "Auction Manager doesn not have 0 SOV");

    // get average price of token 
    let pricePerToken = await AuctionManagerInstance.pricePerToken.call()
    assert.equal((pricePerToken / 1E18).toFixed(2), 1.67, "After bids of 100,000, auction manager has an average price per token of $1.67");    

    // generate next auction 
    const nextAuctionAddress = await AuctionManagerInstance.createAuction.call()
    await AuctionManagerInstance.createAuction()
    const NextAuctionInstance = await Auction.at(nextAuctionAddress)

    // expect tranche size to work
    const trancheSize = await NextAuctionInstance.trancheSize.call()
    // it rounds down
    assert.equal(trancheSize, 25853, "trancheSize does not work");    

    // bid another 100k
    // mint some coins for account 2 
    await USDCInstance.mint.sendTransaction(accounts[1], toBN(100000).mul(toBN(1E18)));
    // authorize and send coins to contract
    await USDCInstance.approve.sendTransaction(nextAuctionAddress, toBN(100000).mul(toBN(1E18)), {from: accounts[1]})
    // second bid 
    await NextAuctionInstance.bid.sendTransaction(toBN(100000).mul(toBN(1E18)), {from: accounts[1]})

    pricePerTokenInTranche = await NextAuctionInstance.pricePerToken.call()
    assert.equal((pricePerTokenInTranche / 1E18).toFixed(2), 3.87, "After bids of 100,000, auction has a price per token of $3.87");    

    // fast forward in time to end of auction
    await time.increase(time.duration.hours(1));

    // trigger the payout of the contract.
    await NextAuctionInstance.payout.sendTransaction();

    // overall price per token is 2.33
    pricePerToken = await AuctionManagerInstance.pricePerToken.call()
    assert.equal((pricePerToken / 1E18).toFixed(2), 2.33, "After two auctions, auction manager has an average price per token of $2.33");    

    // elsewhere
    // get auctions from auciton manager array
    const auctionsArr = await AuctionManagerInstance.getAuctions.call();
    assert.equal(auctionsArr[0], AuctionInstance.address, "auction");    
    assert.equal(auctionsArr[1], NextAuctionInstance.address, "auction");  

    // try to bid on an expired auction, expect failure
    // authorize and send coins to contract
    await USDCInstance.approve.sendTransaction(auctionAddress, toBN(70000).mul(toBN(1E18)), {from: accounts[2]})
    // do not fastforward in time,  but still make bid
    await expectRevert(AuctionInstance.bid.sendTransaction(toBN(70000).mul(toBN(1E18)), {from: accounts[2]}), "Auction has already finished")

    // let's try to payout on an empty auction
    const lastAuctionAddress = await AuctionManagerInstance.createAuction.call()
    await AuctionManagerInstance.createAuction()
    const LastAuctionInstance = await Auction.at(lastAuctionAddress)

    // fast forward in time to end of auction
    await time.increase(time.duration.hours(1));

    await LastAuctionInstance.payout.sendTransaction();
    // let's try to payout twice 
    await LastAuctionInstance.payout.sendTransaction();

    // make sure price per token of historical auctoin is still the same 
    pricePerTokenInTranche = await AuctionInstance.pricePerToken.call()
    assert.equal((pricePerTokenInTranche / 1E18).toFixed(2), 1.67, "After bids of 100,000, auction has a price per token of $1.67");    

  });
});

// test --show-events