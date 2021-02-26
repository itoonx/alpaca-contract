import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, DeploymentSubmission } from 'hardhat-deploy/types';
import { ethers, upgrades } from 'hardhat';
import { CakeToken__factory, MockERC20__factory } from '../typechain';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  if (network.name !== 'testnet') {
    console.log('This deployment script should be run against testnet only')
    return
  }

  const { deployer } = await getNamedAccounts();

  console.log(">> Deploying BUSD");
  const MockERC20 = (await ethers.getContractFactory(
    'MockERC20',
    (await ethers.getSigners())[0]
  )) as MockERC20__factory;
  const busd = await upgrades.deployProxy(MockERC20, ['BUSD', 'BUSD']);
  await busd.deployed();
  console.log(`>> BUSD deployed at: ${busd.address}`)
  await deployments.save('BUSD', { address: busd.address } as DeploymentSubmission)

  await deploy('CAKE', {
    from: deployer,
    contract: 'CakeToken',
    log: true,
    deterministicDeployment: false,
  });

  await deploy('SYRUP', {
    from: deployer,
    args: [
      (await deployments.get('CAKE')).address,
    ],
    contract: 'SyrupBar',
    log: true,
    deterministicDeployment: false,
  });

  console.log(">> Minting 100 BUSDs");
  await busd.mint(deployer, ethers.utils.parseEther('100'), { gasLimit: '210000' });
  console.log("✅ Done")

  console.log(">> Minting 1,000,000,000 CAKEs")
  const cake = CakeToken__factory.connect(
    (await deployments.get('CAKE')).address, (await ethers.getSigners())[0]);
  await cake['mint(address,uint256)'](deployer, ethers.utils.parseEther('1000000000'), { gasLimit: '210000' });
  console.log("✅ Done")
};

export default func;
func.tags = ['Testnet'];