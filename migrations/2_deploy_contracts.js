const SOVToken = artifacts.require("SOVToken");
const AuctionManager = artifacts.require("AuctionManager");
const USDC = artifacts.require("USDC");

module.exports = function(deployer) {
	deployer.deploy(SOVToken).then(function() {
		return deployer.deploy(USDC)
	}).then(function() {
		return deployer.deploy(AuctionManager, SOVToken.address, USDC.address, 24000000, 25, 18, 4000);
	});	
};