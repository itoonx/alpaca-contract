import { ethers, upgrades, waffle } from "hardhat";
import { Signer, BigNumberish, utils, Wallet } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import "@openzeppelin/test-helpers";
import {
  MockERC20,
  MockERC20__factory,
  StrategyWithdrawMinimizeTrading,
  StrategyWithdrawMinimizeTrading__factory,
  UniswapV2Factory,
  UniswapV2Factory__factory,
  UniswapV2Pair,
  UniswapV2Pair__factory,
  UniswapV2Router02,
  UniswapV2Router02__factory,
  WETH,
  WETH__factory
} from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe('Pancakeswap - StrategyWithdrawMinimizeTrading', () => {
  const FOREVER = '2000000000';

  /// Uniswap-related instance(s)
  let factory: UniswapV2Factory;
  let router: UniswapV2Router02;
  let lp: UniswapV2Pair;

  /// Token-related instance(s)
  let weth: WETH;
  let baseToken: MockERC20;
  let quoteToken: MockERC20;

  /// Strategy-ralted instance(s)
  let strat: StrategyWithdrawMinimizeTrading;

  // Accounts
  let deployer: Signer;
  let alice: Signer;
  let bob: Signer;

  // Contract Signer
  let baseTokenAsAlice: MockERC20;
  let baseTokenAsBob: MockERC20;

  let lpAsAlice: UniswapV2Pair;
  let lpAsBob: UniswapV2Pair;

  let quoteTokenAsAlice: MockERC20;
  let quoteTokenAsBob: MockERC20;

  let routerAsAlice: UniswapV2Router02;
  let routerAsBob: UniswapV2Router02;

  let stratAsAlice: StrategyWithdrawMinimizeTrading;
  let stratAsBob: StrategyWithdrawMinimizeTrading;

  beforeEach(async () => {
    [deployer, alice, bob] = await ethers.getSigners();

    // Setup Uniswap
    const UniswapV2Factory = (await ethers.getContractFactory(
      "UniswapV2Factory",
      deployer
    )) as UniswapV2Factory__factory;
    factory = await UniswapV2Factory.deploy((await deployer.getAddress()));
    await factory.deployed();

    const WETH = (await ethers.getContractFactory(
      "WETH",
      deployer
    )) as WETH__factory;
    weth = await WETH.deploy();
    await factory.deployed();

    const UniswapV2Router02 = (await ethers.getContractFactory(
      "UniswapV2Router02",
      deployer
    )) as UniswapV2Router02__factory;
    router = await UniswapV2Router02.deploy(factory.address, weth.address);
    await router.deployed();

    /// Setup token stuffs
    const MockERC20 = (await ethers.getContractFactory(
      "MockERC20",
      deployer
    )) as MockERC20__factory
    baseToken = await upgrades.deployProxy(MockERC20, ['BTOKEN', 'BTOKEN']) as MockERC20;
    await baseToken.deployed();
    await baseToken.mint(await alice.getAddress(), ethers.utils.parseEther('100'));
    await baseToken.mint(await bob.getAddress(), ethers.utils.parseEther('100'));
    quoteToken = await upgrades.deployProxy(MockERC20, ['FTOKEN', 'FTOKEN']) as MockERC20;
    await quoteToken.deployed();
    await quoteToken.mint(await alice.getAddress(), ethers.utils.parseEther('1'));
    await quoteToken.mint(await bob.getAddress(), ethers.utils.parseEther('1'));

    await factory.createPair(baseToken.address, quoteToken.address);

    lp = UniswapV2Pair__factory.connect(await factory.getPair(quoteToken.address, baseToken.address), deployer);

    const StrategyWithdrawMinimizeTrading = (await ethers.getContractFactory(
      "StrategyWithdrawMinimizeTrading",
      deployer
    )) as StrategyWithdrawMinimizeTrading__factory;
    strat = await upgrades.deployProxy(StrategyWithdrawMinimizeTrading, [router.address]) as StrategyWithdrawMinimizeTrading;
    await strat.deployed();

    // Assign contract signer
    baseTokenAsAlice = MockERC20__factory.connect(baseToken.address, alice);
    baseTokenAsBob = MockERC20__factory.connect(baseToken.address, bob);

    quoteTokenAsAlice = MockERC20__factory.connect(quoteToken.address, alice);
    quoteTokenAsBob = MockERC20__factory.connect(quoteToken.address, bob);

    routerAsAlice = UniswapV2Router02__factory.connect(router.address, alice);
    routerAsBob = UniswapV2Router02__factory.connect(router.address, bob);

    lpAsAlice = UniswapV2Pair__factory.connect(lp.address, alice);
    lpAsBob = UniswapV2Pair__factory.connect(lp.address, bob);

    stratAsAlice = StrategyWithdrawMinimizeTrading__factory.connect(strat.address, alice);
    stratAsBob = StrategyWithdrawMinimizeTrading__factory.connect(strat.address, bob);
  });

  context('It should convert LP tokens and farming token', () => {
    beforeEach(async () => {
      // Alice adds 0.1 FTOKEN + 1 BaseToken
      await baseTokenAsAlice.approve(router.address, ethers.utils.parseEther('1'));
      await quoteTokenAsAlice.approve(router.address, ethers.utils.parseEther('0.1'));
      await routerAsAlice.addLiquidity(
        baseToken.address, quoteToken.address,
        ethers.utils.parseEther('1'), ethers.utils.parseEther('0.1'), '0', '0', await alice.getAddress(), FOREVER);

      // Bob tries to add 1 FTOKEN + 1 BaseToken (but obviously can only add 0.1 FTOKEN)
      await baseTokenAsBob.approve(router.address, ethers.utils.parseEther('1'));
      await quoteTokenAsBob.approve(router.address, ethers.utils.parseEther('1'));
      await routerAsBob.addLiquidity(
        baseToken.address, quoteToken.address,
        ethers.utils.parseEther('1'), ethers.utils.parseEther('1'), '0', '0', await bob.getAddress(), FOREVER);

      expect(await quoteToken.balanceOf(await bob.getAddress())).to.be.bignumber.eq(ethers.utils.parseEther('0.9'));
      expect(await lp.balanceOf(await bob.getAddress())).to.be.bignumber.eq(ethers.utils.parseEther('0.316227766016837933'));

      await lpAsBob.transfer(strat.address, ethers.utils.parseEther('0.316227766016837933'));
    });

    it('should revert, Bob uses withdraw minimize trading strategy to turn LPs back to farming with an unreasonable expectation', async () => {
      // Bob uses withdraw minimize trading strategy to turn LPs back to farming with an unreasonable expectation
      await expect(
        stratAsBob.execute(
          await bob.getAddress(),
          ethers.utils.parseEther('1'),
          ethers.utils.defaultAbiCoder.encode(
            ['address','address', 'uint256'],
            [baseToken.address, quoteToken.address, ethers.utils.parseEther('2')]),
        ),
      ).to.be.revertedWith('insufficient quote tokens received')
    });

    it('should convert all LP tokens back to BaseToken and FTOKEN, while debt == received BaseToken', async () => {
      const bobBaseTokenBefore = await baseToken.balanceOf(await bob.getAddress());
      const bobFTOKENBefore = await quoteToken.balanceOf(await bob.getAddress());

      // Bob uses minimize trading strategy to turn LPs back to BaseToken and FTOKEN
      await stratAsBob.execute(
        await bob.getAddress(),
        ethers.utils.parseEther('1'), // debt 1 BaseToken
        ethers.utils.defaultAbiCoder.encode(
          ['address','address', 'uint256'],
          [baseToken.address, quoteToken.address, ethers.utils.parseEther('0.001')])
      );

      const bobBaseTokenAfter = await baseToken.balanceOf(await bob.getAddress());
      const bobFTOKENAfter = await quoteToken.balanceOf(await bob.getAddress());

      expect(await lp.balanceOf(strat.address)).to.be.bignumber.eq(ethers.utils.parseEther('0'));
      expect(await lp.balanceOf(await bob.getAddress())).to.be.bignumber.eq(ethers.utils.parseEther('0'))
      expect(bobBaseTokenAfter.sub(bobBaseTokenBefore)).to.be.bignumber.eq(ethers.utils.parseEther('1'));
      expect(bobFTOKENAfter.sub(bobFTOKENBefore)).to.be.bignumber.eq(ethers.utils.parseEther('0.1'));
    });

    it('should convert all LP tokens back to BaseToken and FTOKEN when debt < received BaseToken', async () => {
      const bobBtokenBefore = await baseToken.balanceOf(await bob.getAddress());
      const bobFtokenBefore = await quoteToken.balanceOf(await bob.getAddress());

      // Bob uses liquidate strategy to turn LPs back to ETH and farming token
      await stratAsBob.execute(
        await bob.getAddress(),
        ethers.utils.parseEther('0.5'), // debt 0.5 ETH
        ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256'],
          [baseToken.address, quoteToken.address, ethers.utils.parseEther('0.001')]),
      );

      const bobBtokenAfter = await baseToken.balanceOf(await bob.getAddress());
      const bobFtokenAfter = await quoteToken.balanceOf(await bob.getAddress());

      expect(await lp.balanceOf(strat.address)).to.be.bignumber.eq(ethers.utils.parseEther('0'));
      expect(await lp.balanceOf(await bob.getAddress())).to.be.bignumber.eq(ethers.utils.parseEther('0'))
      expect(bobBtokenAfter.sub(bobBtokenBefore)).to.be.bignumber.eq(ethers.utils.parseEther('1'));
      expect(bobFtokenAfter.sub(bobFtokenBefore)).to.be.bignumber.eq(ethers.utils.parseEther('0.1'));
    });

    it('should convert all LP tokens back to BaseToken and farming token (debt > received BaseToken, farming token is enough to cover debt)', async () => {
      const bobBtokenBefore = await baseToken.balanceOf(await bob.getAddress());
      const bobFtokenBefore = await quoteToken.balanceOf(await bob.getAddress());

      // Bob uses withdraw minimize trading strategy to turn LPs back to BaseToken and farming token
      await stratAsBob.execute(
        await bob.getAddress(),
        ethers.utils.parseEther('1.2'), // debt 1.2 BaseToken
        ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256'],
          [baseToken.address, quoteToken.address, ethers.utils.parseEther('0.001')]),
      );

      const bobBtokenAfter = await baseToken.balanceOf(await bob.getAddress());
      const bobFtokenAfter = await quoteToken.balanceOf(await bob.getAddress());

      expect(await lp.balanceOf(strat.address)).to.be.bignumber.eq(ethers.utils.parseEther('0'));
      expect(await lp.balanceOf(await bob.getAddress())).to.be.bignumber.eq(ethers.utils.parseEther('0'))
      expect(bobBtokenAfter.sub(bobBtokenBefore)).to.be.bignumber.eq(ethers.utils.parseEther('1.2'));
      expect(bobFtokenAfter.sub(bobFtokenBefore)).to.be.bignumber.eq(ethers.utils.parseEther('0.074924774322968906')); // 0.1 - 0.025 = 0.075 farming token
    });

    it('should revert when debt > received BaseToken, farming token is not enough to cover the debt', async () => {
      await expect(
        stratAsBob.execute(
          await bob.getAddress(),
          ethers.utils.parseEther('3'), // debt 2 BaseToken
          ethers.utils.defaultAbiCoder.encode(
            ['address', 'address', 'uint256'],
            [baseToken.address, quoteToken.address, ethers.utils.parseEther('0.001')]),
        ),
      ).to.be.revertedWith('subtraction overflow')
    });

  });
});
