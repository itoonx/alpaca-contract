import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, upgrades } from 'hardhat';
import { AlpacaToken__factory, FairLaunch, FairLaunch__factory, UniswapV2Router02__factory } from '../typechain';

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
  const ALPACA_REWARD_PER_BLOCK = ethers.utils.parseEther('20');
  const BONUS_MULTIPLIER = 7;
  const BONUS_END_BLOCK = '9975040';
  const BONUS_LOCK_BPS = '7000';
  const START_BLOCK = '8885040';














  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('AlpacaToken', {
    from: deployer,
    args: [
      6499649,
      6699649,
    ],
    log: true,
    deterministicDeployment: false,
  });

  const alpacaToken = AlpacaToken__factory.connect(
    (await deployments.get('AlpacaToken')).address, (await ethers.getSigners())[0]);

  await deploy('FairLaunch', {
    from: deployer,
    args: [
      alpacaToken.address,
      deployer,
      ALPACA_REWARD_PER_BLOCK,
      START_BLOCK, 0, 0
    ],
    log: true,
    deterministicDeployment: false,
  })
  const fairLaunch = FairLaunch__factory.connect(
    (await deployments.get('FairLaunch')).address, (await ethers.getSigners())[0])

  console.log(">> Transferring ownership of AlpacaToken from deployer to FairLaunch");
  await alpacaToken.transferOwnership(fairLaunch.address, { gasLimit: '500000' });
  console.log("✅ Done");

  console.log(`>> Set Fair Launch bonus to BONUS_MULTIPLIER: "${BONUS_MULTIPLIER}", BONUS_END_BLOCK: "${BONUS_END_BLOCK}", LOCK_BPS: ${BONUS_LOCK_BPS}`)
  await fairLaunch.setBonus(BONUS_MULTIPLIER, BONUS_END_BLOCK, BONUS_LOCK_BPS)
  console.log("✅ Done");
};

export default func;
func.tags = ['FairLaunch'];