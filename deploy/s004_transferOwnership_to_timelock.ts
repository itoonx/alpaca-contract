import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {  Ownable, Ownable__factory } from '../typechain'
import { ethers, upgrades } from 'hardhat';

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

  const TIMELOCK = "0xCaFc886CB1D4655193A901d9863f0163D07b3b1A";

  const TO_BE_LOCKED = [
    '0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F', // FairLaunch
    '0x166f56F2EDa9817cAB77118AE4FCAA0002A17eC7', // SimpleOracle
    '0xADaBC5FC5da42c85A84e66096460C769a151A8F8', // WorkerConfig
    '0x53dbb71303ad0F9AFa184B8f7147F9f12Bb5Dc01', // Vault - Config -> Interest Bearing BNB
    '0xd7D069493685A581d27824Fc46EdA46B7EfC0063', // Vault - Address -> Interest Bearing BNB
    '0xd7b805E88c5F52EDE71a9b93F7048c8d632DBEd4', // Vault - Config -> Interest Bearing BUSD
    '0x7C9e73d4C71dae564d41F78d56439bB4ba87592f'  // Vault - Address -> Interest Bearing BUSD
  ];











  for(let i = 0; i < TO_BE_LOCKED.length; i++ ) {
    console.log(`>> Transferring ownership of ${TO_BE_LOCKED[i]} to TIMELOCK`);
    const ownable = Ownable__factory.connect(TO_BE_LOCKED[i], (await ethers.getSigners())[0]);
    await ownable.transferOwnership(TIMELOCK);
    console.log("✅ Done")
  }
};

export default func;
func.tags = ['TransferOwnershipToTimeLock'];