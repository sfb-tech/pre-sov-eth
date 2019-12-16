pragma solidity >=0.4.25 <0.6.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/access/roles/MinterRole.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

contract SOVToken is ERC20, ERC20Detailed, ERC20Mintable, ERC20Burnable, Ownable {
  	using SafeMath for uint256;

  	constructor ()
	ERC20Burnable()
	ERC20Mintable()
	ERC20Detailed('SOVTokens','SOV', 4)
	ERC20()
	public {}

	// list of members on the whitelist 
	mapping (address => bool) public whitelist;
	// list of admins on the whitelist 
	mapping (address => bool) public admins;

	// add an address as an admin, only owner has authority to do so
	function addAdmin(address addr) public onlyOwner returns(bool) {
		admins[addr] = true;
		return true;
	}

	// remove an address from being an admin, only owner has authority to do so
	function removeAdmin(address addr) public onlyOwner returns(bool) {
		admins[addr] = false;
		return false;
	}

	// approve an address and add it to our whitelist
	// only admin has authority to add members to the whitelist
	function addToWhiteList(address addr) public returns(bool) {
		require(admins[msg.sender] == true, "Only admins can add to whitelist");
		whitelist[addr] = true;
		return true;
	}

	// remove an address from our whitelist
	// only admin has authority to remove members from the whitelist
	function removeFromWhiteList(address addr) public returns(bool) {
		require(admins[msg.sender] == true, "Only admins can remove from whitelist");
		whitelist[addr] = false;
		return false;
	}

	// check if the transaction is valid by checking if 
	// the sender address is on our whitelist
	// as well as the receiving address
	function verifyTransfer(address _from, address _to) public view returns(bool) {
		require(whitelist[_from], "from address not on whitelist");
		require(whitelist[_to], "to address not on whitelist");
		return true;
	}

	// Override the transfer method to support our custom verify transfer functoin
	// Still fixing a bug with transfer method
	function transfer(address _to, uint256 _value) public returns (bool) {
	    verifyTransfer(msg.sender, _to);
	    _transfer(msg.sender, _to, _value);
	    return true;
	}
}