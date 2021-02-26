pragma solidity 0.6.6;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IDebtToken.sol";

contract DebtToken is IDebtToken, ERC20UpgradeSafe, OwnableUpgradeSafe {

  constructor(string memory _name, string memory _symbol) public {
    OwnableUpgradeSafe.__Ownable_init();
    ERC20UpgradeSafe.__ERC20_init(_name, _symbol);
  }

  function mint(address to, uint256 amount) public override onlyOwner {
    _mint(to, amount);
  }

  function burn(address from, uint256 amount) public override onlyOwner {
    _burn(from, amount);
  }
}