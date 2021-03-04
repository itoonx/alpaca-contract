pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./AlpacaToken.sol";
import "./StrongAlpacaRelayer.sol";
import "./interfaces/IStrongAlpaca.sol";
import "../utils/SafeToken.sol";
import "hardhat/console.sol";

// StrongHodl is a smart contract for ALPACA time-locking by asking user to lock ALPACA for a period of time.
contract StrongAlpaca is IStrongAlpaca, ERC20("Strong Alpaca", "STRONCA"), Ownable {
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

  function prepareHodl() external override blockReentrancy {
    require(_userRelayerMap[msg.sender] == address(0), "StrongAlpaca::prepareHodl: user has already prepared hodl");
    require(block.number < hodlableEndBlock, "StrongAlpaca::prepareHodl: block.number exceeds hodlableEndBlock");

    // create relayer contract
    StrongAlpacaRelayer relayer = new StrongAlpacaRelayer(alpacaTokenAddress, msg.sender);
    _userRelayerMap[msg.sender] = address(relayer);
  }

  function hodl() external override blockReentrancy {
    address relayerAddress = _userRelayerMap[msg.sender];

    require(relayerAddress != address(0), "StrongAlpaca::hodl: user has not preapare hodl yet");
    require(block.number < hodlableEndBlock, "StrongAlpaca::hodl: block.number exceeds hodlableEndBlock");

    uint256 relayerAlpacaLockedBalance = alpacaToken.lockOf(relayerAddress);
    StrongAlpacaRelayer relayer = StrongAlpacaRelayer(relayerAddress);

    relayer.transferAllAlpaca();
    _mint(msg.sender, relayerAlpacaLockedBalance);
  }

  function unhodl() external override blockReentrancy {
    require(block.number > lockEndBlock, "StrongAlpaca::noHodl: block.number have not reach lockEndBlock");
    require(
      block.number > alpacaToken.endReleaseBlock(),
      "StrongAlpaca::noHodl: block.number have not reach alpacaToken.endReleaseBlock"
    );

    // unlock all the Alpaca token in case it never have been unlocked yet
    // Note: given that releasePeriodEnd has passed, so that locked token has been 100% released
    if (alpacaToken.lockOf(address(this)) > 0) {
      alpacaToken.unlock();
    }

    uint256 userStrongAlpacaBalance = balanceOf(msg.sender);
    // Note: user must approve this contract to move Strong Alpaca token to its address
    // user transfer Strong Alpaca back
    SafeERC20.safeTransferFrom(this, msg.sender, address(this), userStrongAlpacaBalance);

    // transfer Alpaca from Strong Alpaca to user
    SafeERC20.safeApprove(alpacaToken, address(this), userStrongAlpacaBalance);
    SafeERC20.safeTransferFrom(alpacaToken, address(this), msg.sender, userStrongAlpacaBalance);
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
