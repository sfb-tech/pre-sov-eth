const SOVToken = artifacts.require("SOVToken");
const AuctionManager = artifacts.require("AuctionManager");
const USDC = artifacts.require("USDC");

module.exports = function(deployer) {
	// for prod
	// return deployer.deploy(AuctionManager, '0xd9385da158bd4ba2DC493Bc18746Ad9C35677813', '0x8f7CbF9E173A2E388E36C678e06Fc8582A5d77De', 24000000, 25, 18, 4000);
	// for local
	deployer.deploy(SOVToken).then(function() {
		return deployer.deploy(USDC)
	}).then(function() {
		return deployer.deploy(AuctionManager, SOVToken.address, USDC.address, 24000000, 25, 18, 4000);
	});	
};