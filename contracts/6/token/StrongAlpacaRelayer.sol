pragma solidity 0.6.6;

import "./AlpacaToken.sol";
import "./interfaces/IStrongAlpacaRelayer.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract StrongAlpacaRelayer is Ownable, IStrongAlpacaRelayer {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  // Alpaca address
  AlpacaToken public alpacaToken;

  // User address
  address public userAddress;

  // only contract can change this variable
  bool internal locked;
  modifier blockReentrancy {
    require(!locked, "Contract is locked");
    locked = true;
    _;
    locked = false;
  }

  constructor(
    address _alpacaAddress,
    address _userAddress
  ) public {
    alpacaToken = AlpacaToken(_alpacaAddress);
    userAddress = _userAddress;
  }

  function transferAllAlpaca() external override blockReentrancy onlyOwner {
    address strongAlpacaAddress = msg.sender;
    SafeERC20.safeApprove(alpacaToken, address(this), alpacaToken.balanceOf(address(this)));
    SafeERC20.safeTransferFrom(alpacaToken, address(this), userAddress, alpacaToken.balanceOf(address(this)));
    alpacaToken.transferAll(strongAlpacaAddress);
  }
}