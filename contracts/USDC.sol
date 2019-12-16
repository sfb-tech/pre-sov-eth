pragma solidity >=0.4.25 <0.6.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/access/roles/MinterRole.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

// a template USDC contract used for testing
// USDC on mainnet located at 0xb9e31a22e3a1c743c6720f3b723923e91f3c0f8b
contract USDC is ERC20, ERC20Detailed, ERC20Mintable, ERC20Burnable, Ownable {
  	using SafeMath for uint256;

  	constructor ()
	ERC20Burnable()
	ERC20Mintable()
	ERC20Detailed('USDC','USDC', 18)
	ERC20()
	public {}
}