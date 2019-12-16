pragma solidity >=0.4.25 <0.6.0;

import "./SOVToken.sol";
import "./USDC.sol";
import "./Auction.sol";
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
// import "./FixidityLib.sol";

// in this model we can create several auction instances, 
// in which each instance represents a tranche
contract AuctionManager is Ownable {
	using SafeMath for uint256;

	mapping(address => Auction) auctions;
	Auction[] auctionIndexes;

	uint256 public supply;
	uint256 public initialPercent;
	uint256 public initialPercentD;
	uint256 public tranches;
	uint256 public supplyPercent;
	uint256 public supplyPercentD;

	SOVToken public sov;
	USDC public usdc;

	event AuctionCompletion(address auctionAddress);

	constructor(
		SOVToken _sov, 
		USDC _usdc, 
		uint256 _supply, 
		uint256 _initialPercent, 
		uint256 _tranches, 
		uint256 _supplyPercent
	) public {
		sov = _sov;
		usdc = _usdc;
		// initialize the variables for the auction manager
		supply = _supply;
		initialPercent = _initialPercent ; // .25%
		initialPercentD = 10000;
		// initialPercent = FixidityLib.fractional(0.0025);
		tranches = _tranches;
		supplyPercent = _supplyPercent; // 40%
		supplyPercentD = 10000;
		// supplyPercent = FixidityLib.fractional(0.4);
	}

	function getTrancheSize() public returns(uint256) {
		if(auctionIndexes.length == 0) {
			return supply * initialPercent / initialPercentD;
		}
		// calculate based off of previous auctions 
		uint totalRaised = 0;
		uint sumOfTranches = 0;
		for (uint i=0; i < auctionIndexes.length; i++) {
			Auction auction = auctionIndexes[i];
			uint256 auctionRaised = auction.totalRaised();
			totalRaised += auctionRaised;
			uint256 auctionTrancheSize = auction.trancheSize();
			sumOfTranches += auctionTrancheSize;
		}

		uint averageRaise = totalRaised / auctionIndexes.length;
		uint marshallIslandsGDP = 180000000; // 18 billion dollars
		uint trancheSize = averageRaise / ((marshallIslandsGDP * supplyPercent * tranches * averageRaise / 2) * supply * supplyPercent - sumOfTranches); 

		// return new tranche size 
		return trancheSize;
	}

	function createAuction() public onlyOwner returns(address) {
		// determine how large the tranche size is for the next auction
	   	uint256 trancheSize = getTrancheSize();
	   	// create the next auction, configure the tranche size
	   	Auction newAuction = new Auction(this, sov, usdc, trancheSize);
	    address auctionAddress = address(newAuction);
	    // save the auction to our auctions key-value mapping
	    auctions[auctionAddress] = newAuction;
	   	require(auctions[address(newAuction)] == newAuction, "auction not saved.");
	   	auctionIndexes.push(newAuction);
	   	 // mint sov tokens and send those tokens to auction instance
   		sov.mint(auctionAddress, trancheSize * 10**4);
   		// add auction to whitelist, so it can transfer (in payout)
   		sov.addToWhiteList(auctionAddress);
	    return auctionAddress;
	}

	// function onAuctionCompletion(address auctionAddress) public { 
	// 	emit AuctionCompletion(auctionAddress);
	// 	address nextAuction = createAuction();
	// } 
}

