pragma solidity >=0.4.25 <0.6.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/SOVToken.sol";

contract TestSOVToken {

  // function testInitialBalanceUsingDeployedContract() public {
  //   SOVToken meta = SOVToken(DeployedAddresses.SOVToken());

  //   uint expected = 10000;

  //   Assert.equal(meta.balanceOf(tx.origin), expected, "Owner should have 10000 SOVToken initially");
  // }

  // function testInitialBalanceWithNewSOVToken() public {
  //   SOVToken meta = new SOVToken();

  //   uint expected = 10000;

  //   Assert.equal(meta.balanceOf(tx.origin), expected, "Owner should have 10000 SOVToken initially");
  // }

}
