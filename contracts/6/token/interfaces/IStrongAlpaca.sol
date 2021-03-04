pragma solidity 0.6.6;

interface IStrongAlpaca {
  function prepareHodl() external;
  function hodl() external;
  function unhodl() external;

  event PrepareHodl(address indexed user, address indexed relayer);
  event Hodl(address indexed user, address indexed relayer, uint256 receivingStrongAlpacaAmount);
  event Unhodl(address indexed user, uint256 receivingAlpacaAmount);
}
