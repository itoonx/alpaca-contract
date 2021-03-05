pragma solidity 0.6.6;

import "./interfaces/IAlpacaToken.sol";
import "./interfaces/IStrongAlpacaRelayer.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract StrongAlpacaRelayer is Ownable, IStrongAlpacaRelayer {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  // Alpaca address
  address public alpacaTokenAddress;

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
    alpacaTokenAddress = _alpacaAddress;
    userAddress = _userAddress;
  }

  function transferAllAlpaca() external override blockReentrancy onlyOwner {
    SafeERC20.safeApprove(IERC20(alpacaTokenAddress), address(this), IERC20(alpacaTokenAddress).balanceOf(address(this)));
    SafeERC20.safeTransferFrom(IERC20(alpacaTokenAddress), address(this), userAddress, IERC20(alpacaTokenAddress).balanceOf(address(this)));
    IAlpacaToken(alpacaTokenAddress).transferAll(msg.sender);
  }
}
