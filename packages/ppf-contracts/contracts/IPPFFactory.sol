pragma solidity ^0.4.18;

import "./IFeed.sol";


interface IPPFFactory {
  function newPPF(address operator, address operatorOwner) external returns (IFeed);
}