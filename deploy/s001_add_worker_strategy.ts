import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { IWorker__factory, IStrategy__factory } from '../typechain'

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

  const WORKER_ADDR = '0x2E4410D188856E0e63Af3A3B34e75234b4017c22';
  const STRATEGY_ADDR = '0x1C941637a0a285A823A8FEdE74A8B1B0926a359E';











  const worker = IWorker__factory.connect(
    WORKER_ADDR, (await ethers.getSigners())[0]);
  const strategy = await IStrategy__factory.connect(
    STRATEGY_ADDR, (await ethers.getSigners())[0]);

  console.log(">> Setting Strategy for a Worker");
  await worker.setStrategyOk(
    [strategy.address],
    true,
    {
      gasLimit: '10000000'
    }
  );
  console.log("✅ Done")

};

export default func;
func.tags = ['AddWorkerStrategy'];