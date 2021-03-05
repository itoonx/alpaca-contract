pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAlpacaToken.sol";
import "./interfaces/IStrongAlpaca.sol";
import "./StrongAlpacaRelayer.sol";
import "../utils/SafeToken.sol";

// StrongHodl is a smart contract for ALPACA time-locking by asking user to lock ALPACA for a period of time.
contract StrongAlpaca is IStrongAlpaca, ERC20("Stronk Alpaca", "sALPACA"), Ownable, ReentrancyGuard {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  // Block number when ALPACA cannot be hodl anymore
  uint256 public hodlableEndBlock;

  // Block number when ALPACA can be released.
  uint256 public lockEndBlock;

  // Alpaca address
  address public alpacaTokenAddress;

  // To track the portion of each user Alpaca
  mapping(address => address) private _userRelayerMap;

  // events
  event PrepareHodl(address indexed user, address indexed relayer);
  event Hodl(address indexed user, address indexed relayer, uint256 receivingStrongAlpacaAmount);
  event Unhodl(address indexed user, uint256 receivingAlpacaAmount);

  constructor(
    address _alpacaAddress,
    uint256 _hodlableEndBlock,
    uint256 _lockEndBlock
  ) public {
    _setupDecimals(18);
    alpacaTokenAddress = _alpacaAddress;

    hodlableEndBlock = _hodlableEndBlock;
    lockEndBlock = _lockEndBlock;
  }

  function prepareHodl() external override nonReentrant {
    require(_userRelayerMap[msg.sender] == address(0), "StrongAlpaca::prepareHodl: user has already prepared hodl");
    require(block.number < hodlableEndBlock, "StrongAlpaca::prepareHodl: block.number exceeds hodlableEndBlock");

    // create relayer contract
    StrongAlpacaRelayer relayer = new StrongAlpacaRelayer(alpacaTokenAddress, msg.sender);
    _userRelayerMap[msg.sender] = address(relayer);
    emit PrepareHodl(msg.sender, address(relayer));
  }

  function hodl() external override nonReentrant {
    address relayerAddress = _userRelayerMap[msg.sender];

    require(relayerAddress != address(0), "StrongAlpaca::hodl: user has not preapare hodl yet");

    uint256 relayerAlpacaLockedBalance = IAlpacaToken(alpacaTokenAddress).lockOf(relayerAddress);
    StrongAlpacaRelayer relayer = StrongAlpacaRelayer(relayerAddress);

    relayer.transferAllAlpaca();
    _mint(msg.sender, relayerAlpacaLockedBalance);
    emit Hodl(msg.sender, address(relayer), relayerAlpacaLockedBalance);
  }

  function unhodl() external override nonReentrant {
    require(
      block.number > IAlpacaToken(alpacaTokenAddress).endReleaseBlock(),
      "StrongAlpaca::unhodl: block.number have not reach alpacaToken.endReleaseBlock"
    );
    require(block.number > lockEndBlock, "StrongAlpaca::unhodl: block.number have not reach lockEndBlock");

    // unlock all the Alpaca token in case it never have been unlocked yet
    // Note: given that releasePeriodEnd has passed, so that locked token has been 100% released
    if (IAlpacaToken(alpacaTokenAddress).lockOf(address(this)) > 0) {
      IAlpacaToken(alpacaTokenAddress).unlock();
    }

    uint256 userStrongAlpacaBalance = balanceOf(msg.sender);
    // StrongAlpaca burns all user's StrongAlpaca
    _burn(msg.sender, userStrongAlpacaBalance);

    // transfer Alpaca from Strong Alpaca to user
    SafeERC20.safeTransfer(IERC20(alpacaTokenAddress), msg.sender, userStrongAlpacaBalance);

    emit Unhodl(msg.sender, userStrongAlpacaBalance);
  }

  function getRelayerAddress(address _account) public view returns (address) {
    return _userRelayerMap[_account];
  }
}
