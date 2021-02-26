import { ethers, upgrades, waffle } from "hardhat";
import { Signer, BigNumberish, utils, Wallet } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import "@openzeppelin/test-helpers";
import {
  MockERC20,
  MockERC20__factory,
  StrategyAddBaseTokenOnly,
  StrategyAddBaseTokenOnly__factory,
  StrategyLiquidate,
  StrategyLiquidate__factory,
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

describe('Pancakeswap - StrategyLiquidate', () => {
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
  let strat: StrategyLiquidate;

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

  let stratAsAlice: StrategyAddBaseTokenOnly;
  let stratAsBob: StrategyAddBaseTokenOnly;

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
    await quoteToken.mint(await alice.getAddress(), ethers.utils.parseEther('10'));
    await quoteToken.mint(await bob.getAddress(), ethers.utils.parseEther('10'));

    await factory.createPair(baseToken.address, quoteToken.address);

    lp = UniswapV2Pair__factory.connect(await factory.getPair(quoteToken.address, baseToken.address), deployer);

    const StrategyLiquidate = (await ethers.getContractFactory(
      "StrategyLiquidate",
      deployer
    )) as StrategyLiquidate__factory;
    strat = await upgrades.deployProxy(StrategyLiquidate, [router.address]) as StrategyLiquidate;
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

    stratAsAlice = StrategyAddBaseTokenOnly__factory.connect(strat.address, alice);
    stratAsBob = StrategyAddBaseTokenOnly__factory.connect(strat.address, bob);
  });

  it('should convert all LP tokens back to baseToken', async () => {
    // Alice adds 0.1 FTOKEN + 1 BTOKEN
    await baseTokenAsAlice.approve(router.address, ethers.utils.parseEther('1'));
    await quoteTokenAsAlice.approve(router.address, ethers.utils.parseEther('0.1'));
    await routerAsAlice.addLiquidity(
      baseToken.address, quoteToken.address,
      ethers.utils.parseEther('1'), ethers.utils.parseEther('0.1'), '0', '0',
      await alice.getAddress(), FOREVER);

    // Bob tries to add 1 FTOKEN + 1 BTOKEN (but obviously can only add 0.1 FTOKEN)
    await baseTokenAsBob.approve(router.address, ethers.utils.parseEther('1'));
    await quoteTokenAsBob.approve(router.address, ethers.utils.parseEther('1'));
    await routerAsBob.addLiquidity(
      baseToken.address, quoteToken.address,
      ethers.utils.parseEther('1'), ethers.utils.parseEther('1'), '0', '0',
      await bob.getAddress(), FOREVER);

    expect(await baseToken.balanceOf(await bob.getAddress())).to.be.bignumber.eq(ethers.utils.parseEther('99'));
    expect(await quoteToken.balanceOf(await bob.getAddress())).to.be.bignumber.eq(ethers.utils.parseEther('9.9'));
    expect(await lp.balanceOf(await bob.getAddress())).to.be.bignumber.eq(ethers.utils.parseEther('0.316227766016837933'));

    // Bob uses liquidate strategy to turn all LPs back to BTOKEN but with an unreasonable expectation
    await lpAsBob.transfer(strat.address, ethers.utils.parseEther('0.316227766016837933'));
    await expect(
      strat.execute(await bob.getAddress(), '0',
        ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256'],
          [baseToken.address, quoteToken.address, ethers.utils.parseEther('2')]
        )
      )
    ).to.be.revertedWith('insufficient baseToken received');

    // Bob uses liquidate strategy to turn all LPs back to BTOKEN with a same minimum value
    await strat.execute(await bob.getAddress(), '0',
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'address', 'uint256'],
        [baseToken.address, quoteToken.address, ethers.utils.parseEther('1')]
      )
    );

    expect(await lp.balanceOf(strat.address)).to.be.bignumber.eq(ethers.utils.parseEther('0'));
    expect(await lp.balanceOf(await bob.getAddress())).to.be.bignumber.eq(ethers.utils.parseEther('0'));
    expect(await baseToken.balanceOf(lp.address)).to.be.bignumber.eq(ethers.utils.parseEther('0.500751126690035053'))
    expect(await quoteToken.balanceOf(lp.address)).to.be.bignumber.eq(ethers.utils.parseEther('0.2'))
  });
});
