pragma solidity >=0.4.25 <0.6.0;

import "./SOVToken.sol";
import "./USDC.sol";
import "./AuctionManager.sol";
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

// in this model we can create several auction instances, 
// in which each instance represents a tranche
contract Auction is Ownable {
    using SafeMath for uint256;

    AuctionManager public auctionManager;
    SOVToken public sov;
    USDC public usdc;
    uint256 public trancheSize;
    uint256 public totalRaised = 0;

    // psov:xxxxxx => seller
    address seller;
    // investors => balanceOf
    // todo bool active auction

    event AuctionCreated(address auctionAddress);
    event Payout(address addr, uint256 amount);
    event Contribution(address addr, uint256 amount);

    constructor(
        AuctionManager _auctionManager,
        SOVToken _sov,
        USDC _usdc,
        uint256 _trancheSize
    )
        public
    {
        auctionManager = _auctionManager;
        sov = _sov;
        usdc = _usdc;
        trancheSize = _trancheSize;
    
        seller = msg.sender;
        // auctionEnd = now + timeoutPeriod;
        emit AuctionCreated(address(this));
    }

    mapping(address => uint256) public balanceOf;
    address[] public addressIndexes;
    // results
    mapping(address => uint256) public results;

    event Bid(uint256 bid);

    function bid(uint256 amount) public payable {
        emit Bid(amount);
        require(sov.whitelist(msg.sender), "Address is not on whitelist");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Unable to transfer USDC from address to auction contract");
        // If first time bid, add to our array 
        if(balanceOf[msg.sender] == 0) {
            addressIndexes.push(msg.sender);
        }
        totalRaised += amount;
        balanceOf[msg.sender] += amount;
    }

    function payout() public {
        uint256 totalDeposited = usdc.balanceOf(address(this));
        require(totalDeposited > 0, "total totalDeposited not > 0");
        require(totalDeposited == totalRaised, "total deposited not equal to total raised");
        // cash out the auction first
        require(usdc.transfer(address(auctionManager), totalRaised), "Unable to transfer USDC from auction contract to auction manager");
        // cash out everyone else 
        for (uint i = 0; i < addressIndexes.length; i++) {
            // calculate results of contract
            address addr = addressIndexes[i];
            uint256 percentageContribution = SafeMath.div(balanceOf[addr], (totalDeposited / 10**18));
            require(percentageContribution > 0);
            uint256 amountSOVTokens = SafeMath.mul(percentageContribution, trancheSize) / 10**14;
            require(amountSOVTokens > 0);
            results[addr] = amountSOVTokens;
            emit Payout(addr, amountSOVTokens);
            sov.transfer(addr, amountSOVTokens);
        }
    }

    function pricePerToken() view public returns (uint256) {
        return SafeMath.div(totalRaised, trancheSize);
    }
}
