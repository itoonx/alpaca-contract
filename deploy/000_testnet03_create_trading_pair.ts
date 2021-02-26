import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { UniswapV2Factory__factory } from '../typechain';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  const { deployments, getNamedAccounts, network } = hre;

  if (network.name !== 'testnet') {
    console.log('This deployment script should be run against testnet only')
    return
  }

  const factory = UniswapV2Factory__factory.connect(
    (await deployments.get('UniswapV2Factory')).address, (await ethers.getSigners())[0]);

  console.log(">> Creating the BUSD-WBNB Trading Pair");
  await factory.createPair(
    (await deployments.get('WBNB')).address,
    (await deployments.get('BUSD')).address,
    {
      gasLimit: '10000000',
    }
  );
  console.log("✅ Done");

  console.log(">> Creating the CAKE-WBNB Trading Pair");
  await factory.createPair(
    (await deployments.get('WBNB')).address,
    (await deployments.get('CAKE')).address,
    {
      gasLimit: '10000000',
    }
  );
  console.log("✅ Done");

};

export default func;
func.tags = ['Testnet'];