pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./AlpacaToken.sol";
import "./StrongAlpacaRelayer.sol";
import "./interfaces/IStrongAlpaca.sol";
import "../utils/SafeToken.sol";
import "hardhat/console.sol";

// StrongHodl is a smart contract for ALPACA time-locking by asking user to lock ALPACA for a period of time.
contract StrongAlpaca is IStrongAlpaca, ERC20("Strong Hodl", "STRONG"), Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  // Block number when ALPACA cannot be hodl anymore
  uint256 public hodlableEndBlock;

  // Block number when ALPACA can be released.
  uint256 public lockEndBlock;

  // Alpaca address
  address public alpacaTokenAddress;
  AlpacaToken public alpacaToken;

  // To track the portion of each user Alpaca
  mapping(address => address) private _userRelayerMap;

  bool internal locked; //only contract can change this variable
  modifier blockReentrancy {
    require(!locked, "Contract is locked");
    locked = true;
    _;
    locked = false;
  }

  constructor(
    AlpacaToken _alpacaAddress,
    uint256 _hodlableEndBlock,
    uint256 _lockEndBlock
  ) public {
    _setupDecimals(18);
    alpacaToken = _alpacaAddress;
    alpacaTokenAddress = address(_alpacaAddress);

    hodlableEndBlock = _hodlableEndBlock;
    lockEndBlock = _lockEndBlock;
  }

  function prepareHodl() external blockReentrancy {
    address userAddress = msg.sender;
    require(_userRelayerMap[userAddress] == address(0), "StrongAlpaca::prepareHodl: user has already prepared hodl");
    require(block.number < hodlableEndBlock, "StrongAlpaca::hodl: block.number exceeds hodlableEndBlock");

    // create relayer contract
    StrongAlpacaRelayer relayer = new StrongAlpacaRelayer(alpacaTokenAddress, userAddress);
    _userRelayerMap[userAddress] = address(relayer);
  }

  function hodl() external override blockReentrancy {
    address userAddress = msg.sender;
    address relayerAddress = _userRelayerMap[userAddress];

    require(relayerAddress != address(0), "StrongAlpaca::hodl: user has not preapare hodl yet");
    require(block.number < hodlableEndBlock, "StrongAlpaca::hodl: block.number exceeds hodlableEndBlock");

    uint256 relayerAlpacaLockedBalance = alpacaToken.lockOf(relayerAddress);
    StrongAlpacaRelayer relayer = StrongAlpacaRelayer(relayerAddress);

    relayer.transferAllAlpaca();
    _mint(userAddress, relayerAlpacaLockedBalance);
  }

  function noHodl() external override blockReentrancy {
    require(block.number > lockEndBlock, "StrongAlpaca::noHodl: block.number have not reach lockEndBlock");
    address userAddress = msg.sender;
    uint256 userHodlBalance = balanceOf(userAddress);

    // unlock all the Alpaca token in case it never have been unlocked yet
    if (alpacaToken.lockOf(address(this)) > 0) {
      alpacaToken.unlock();
    }

    // user transfer hodl to hodl
    SafeERC20.safeTransferFrom(this, userAddress, address(this), userHodlBalance);
    // transfer Alpaca from hodl to user
    SafeERC20.safeTransferFrom(alpacaToken, address(this), userAddress, userHodlBalance);
  }

  function getRelayerAddress(address _account) public view returns (address) {
    return _userRelayerMap[_account];
  }

  function _getRevertMsg(bytes memory _returnData) internal pure returns (string memory) {
    // If the _res length is less than 68, then the transaction failed silently (without a revert message)
    if (_returnData.length < 68) return "Transaction reverted silently";

    assembly {
      // Slice the sighash.
      _returnData := add(_returnData, 0x04)
    }
    return abi.decode(_returnData, (string)); // All that remains is the revert string
  }
}
