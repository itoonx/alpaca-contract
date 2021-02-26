pragma solidity 0.6.6;

interface IDebtToken {
  function mint(address to, uint256 amount) external;
  function burn(address from, uint256 amount) external;
}
