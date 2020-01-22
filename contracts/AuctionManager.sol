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

	// mapping(address => Auction) auctions;
	address[] public auctions;

	uint256 public supply;
	uint256 public initialPercent;
	uint256 public initialPercentD;
	uint256 public tranches;
	uint256 public supplyPercent;
	uint256 public supplyPercentD;
	uint public auctionDuration;

	SOVToken public sov;
	USDC public usdc;

	event AuctionCompletion(address auctionAddress);
	// event Log(string s, uint256 amount);

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
		auctionDuration = 1 hours; // 5 seconds 
	}

	function getAuctions() view public returns (address[] memory ) {
	   return auctions;
	}

	function test() public view returns(uint) {
	    return now;
	}

	function getTrancheSize() public view returns(uint256) {
		if(auctions.length == 0) {
			return supply * initialPercent / initialPercentD;
		}
		// calculate based off of previous auctions 
		uint totalRaised = 0;
		uint sumOfTranches = 0;
		for (uint i=0; i < auctions.length; i++) {
			Auction auction = Auction(auctions[i]);
			uint256 auctionRaised = auction.totalRaised();
			totalRaised += auctionRaised;
			uint256 auctionTrancheSize = auction.trancheSize();
			sumOfTranches += auctionTrancheSize;
		}

		uint averageRaise = SafeMath.div(totalRaised, auctions.length);
		uint marshallIslandsGDP = 180000000; // 18 billion dollars
		uint num = (supply * supplyPercent / supplyPercentD) - sumOfTranches;
		uint a = (marshallIslandsGDP * supplyPercent / supplyPercentD);
		uint b = (tranches * totalRaised / (auctions.length) / 10**18);
		uint den = (a + b) / 2;
		uint trancheSizeTokens = SafeMath.div((num * averageRaise), den); 
		uint trancheSize = trancheSizeTokens / 10**18;
		// return new tranche size 
		return trancheSize;
	}

	function createAuction() public returns(address) {
		// only admins (as defined in the sov contract) can create auctions 
		require(sov.admins(msg.sender) == true, "Only admins can create an auction");
		// determine how large the tranche size is for the next auction
	   	uint256 trancheSize = getTrancheSize();
	   	// create the next auction, configure the tranche size
	   	uint endDateTime = now + auctionDuration;
	   	Auction newAuction = new Auction(this, sov, usdc, trancheSize, endDateTime);
	    address auctionAddress = address(newAuction);
	    // save the auction to our auctions key-value mapping
	    // auctions[auctionAddress] = newAuction;
	   	// require(auctions[address(newAuction)] == newAuction, "auction not saved.");
	   	auctions.push(auctionAddress);
	   	 // mint sov tokens and send those tokens to auction instance
   		sov.mint(auctionAddress, trancheSize * 10**4);
   		// add auction to whitelist, so it can transfer (in payout)
   		sov.addToWhiteList(auctionAddress);
	    return auctionAddress;
	}

	function pricePerToken() view public returns (uint) {
	    uint totalRaised = 0;
	    uint sumOfTranches = 0;
	    for (uint i=0; i < auctions.length; i++) {
	    	Auction auction = Auction(auctions[i]);
	    	uint256 auctionRaised = auction.totalRaised();
	    	totalRaised += auctionRaised;
	    	uint256 auctionTrancheSize = auction.trancheSize();
	    	sumOfTranches += auctionTrancheSize;
	    }

	    return SafeMath.div(totalRaised, sumOfTranches);
	}

	// function onAuctionCompletion(address auctionAddress) public { 
	// 	emit AuctionCompletion(auctionAddress);
	// 	address nextAuction = createAuction();
	// } 
}

