import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { PancakeMasterChef__factory, MockERC20__factory, UniswapV2Factory__factory, MockWBNB__factory, CakeToken__factory, SyrupBar__factory } from '../typechain';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  if (network.name !== 'testnet') {
    console.log('This deployment script should be run against testnet only')
    return
  }

  const { deployer } = await getNamedAccounts();

  const CAKE_REWARD_PER_BLOCK = ethers.utils.parseEther('40');
  await deploy('PancakeMasterChef', {
    from: deployer,
    contract: 'PancakeMasterChef',
    args: [
      (await deployments.get('CAKE')).address,
      (await deployments.get('SYRUP')).address,
      deployer,
      CAKE_REWARD_PER_BLOCK,
      0,
    ],
    log: true,
    deterministicDeployment: false,
  });

  const pancakeMasterchef = PancakeMasterChef__factory.connect(
    (await deployments.get('PancakeMasterChef')).address, (await ethers.getSigners())[0]);
  const cake = CakeToken__factory.connect(
    (await deployments.get('CAKE')).address, (await ethers.getSigners())[0]);
  const syrup = SyrupBar__factory.connect(
    (await deployments.get('SYRUP')).address, (await ethers.getSigners())[0]);

  console.log(">> Transferring cake token ownership to MasterChef");
  await cake.transferOwnership(pancakeMasterchef.address, { gasLimit: '210000' });
  console.log("✅ Done")

  console.log(">> Transferring syrup token ownership to MasterChef");
  await syrup.transferOwnership(pancakeMasterchef.address, { gasLimit: '210000' });
  console.log("✅ Done")

};

export default func;
func.tags = ['Testnet'];