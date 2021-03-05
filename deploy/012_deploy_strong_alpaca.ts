import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { StrongAlpaca__factory } from '../typechain';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    /*
  ░██╗░░░░░░░██╗░█████╗░██████╗░███╗░░██╗██╗███╗░░██╗░██████╗░
  ░██║░░██╗░░██║██╔══██╗██╔══██╗████╗░██║██║████╗░██║██╔════╝░
  ░╚██╗████╗██╔╝███████║██████╔╝██╔██╗██║██║██╔██╗██║██║░░██╗░
  ░░████╔═████║░██╔══██║██╔══██╗██║╚████║██║██║╚████║██║░░╚██╗
  ░░╚██╔╝░╚██╔╝░██║░░██║██║░░██║██║░╚███║██║██║░╚███║╚██████╔╝
  ░░░╚═╝░░░╚═╝░░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═╝╚═╝░░╚══╝░╚═════╝░
  Check all variables below before execute the deployment script
  */

  const ALPACA_TOKEN_ADDR = '0x19C64173a4fD5C2Db375f68444B2aA3070e0de08';
  const HODLABLE_END_BLOCK = '5411496'; // hodl can be called until this block
  const LOCK_END_BLOCK = '5511496'; // unhodl can be called after this block












  console.log(">> Deploying a StrongAlpaca contract");
  const StrongAlpaca = (await ethers.getContractFactory(   "StrongAlpaca",    (await ethers.getSigners())[0],  )) as StrongAlpaca__factory;
  const strongAlpaca = await StrongAlpaca.deploy(
    ALPACA_TOKEN_ADDR,
    ethers.BigNumber.from(HODLABLE_END_BLOCK),
    ethers.BigNumber.from(LOCK_END_BLOCK),
  );
  await strongAlpaca.deployed();
  console.log(`>> Deployed at ${strongAlpaca.address}`);
  console.log("✅ Done");

};

export default func;
func.tags = ['StrongAlpaca'];