import { ethers, upgrades, waffle } from "hardhat";
import { Signer, BigNumberish, utils, Wallet, BigNumber } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import "@openzeppelin/test-helpers";
import {
  AlpacaToken,
  AlpacaToken__factory,
  StrongAlpaca,
  StrongAlpaca__factory,
  StrongAlpacaRelayer,
  StrongAlpacaRelayer__factory
} from "../typechain";
import * as TimeHelpers from "./helpers/time"

chai.use(solidity);
const { expect } = chai;

describe("StrongAlpaca and StrongAlpacaRelayer", () => {
  /// Constant
  const ADDRESS0 = "0x0000000000000000000000000000000000000000";

  // Instance(s)
  let strongAlpaca: StrongAlpaca;
  let strongAlpacaAsAlice: StrongAlpaca
  let strongAlpacaAsBob: StrongAlpaca;
  let alpacaToken: AlpacaToken;
  let alpacaTokenAsAlice: AlpacaToken;
  let alpacaTokenAsBob: AlpacaToken;

  // Accounts
  let deployer: Signer;
  let admin: Signer;
  let alice: Signer;
  let bob: Signer;
  let nowBlock: number;

  beforeEach(async () => {
    nowBlock = (await TimeHelpers.latestBlockNumber()).toNumber();
    [deployer, admin, alice, bob] = await ethers.getSigners();
    // Deploy ALPACAs
    const AlpacaToken = (await ethers.getContractFactory(
      "AlpacaToken",
      deployer
    )) as AlpacaToken__factory;
    alpacaToken = await AlpacaToken.deploy(nowBlock, nowBlock + 300);
    await alpacaToken.deployed();

    alpacaTokenAsAlice = AlpacaToken__factory.connect(alpacaToken.address, alice);
    alpacaTokenAsBob = AlpacaToken__factory.connect(alpacaToken.address, bob);

    const StrongAlpaca = (await ethers.getContractFactory(
      "StrongAlpaca",
      deployer
    )) as StrongAlpaca__factory;
    strongAlpaca = await StrongAlpaca.deploy(alpacaToken.address, nowBlock + 100, nowBlock + 500);
    await strongAlpaca.deployed();

    strongAlpacaAsAlice = StrongAlpaca__factory.connect(strongAlpaca.address, alice);
    strongAlpacaAsBob = StrongAlpaca__factory.connect(strongAlpaca.address, bob);
  });

  context('when alice and bob want to hodl StrongAlpaca', async () => {
    it('should be able hodl successfully with correct balances', async () => {
      const aliceAddress = await alice.getAddress()
      const bobAddress = await bob.getAddress()

      // 100 Alpaca to alice
      await alpacaToken.mint(aliceAddress, ethers.utils.parseEther('120'))
      await alpacaToken.lock(aliceAddress, ethers.utils.parseEther('100'))

      // 50 Alpaca to bob
      await alpacaToken.mint(bobAddress, ethers.utils.parseEther('50'))
      await alpacaToken.lock(bobAddress, ethers.utils.parseEther('50'))

      // Alice prepare hodl
      expect(await strongAlpaca.getRelayerAddress(aliceAddress)).to.equal(ADDRESS0)
      await strongAlpacaAsAlice.prepareHodl()
      const aliceRelayerAddress = await strongAlpaca.getRelayerAddress(aliceAddress)
      expect(aliceRelayerAddress).to.not.equal(ADDRESS0)

      // Bob prepare hodl
      expect(await strongAlpaca.getRelayerAddress(bobAddress)).to.equal(ADDRESS0)
      await strongAlpacaAsBob.prepareHodl()
      const bobRelayerAddress = await strongAlpaca.getRelayerAddress(bobAddress)
      expect(bobRelayerAddress).to.not.equal(ADDRESS0)

      // make sure bobRelayerAddress != aliceRelayerAddress
      expect(bobRelayerAddress).to.not.equal(aliceRelayerAddress)

      // Alice transferAll locked Alpaca token to relayer, so that we expect to see both of their balance and lock amount correct
      expect(await alpacaToken.balanceOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('20'))
      expect(await alpacaToken.lockOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('100'))
      expect(await alpacaToken.balanceOf(aliceRelayerAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(aliceRelayerAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      await alpacaTokenAsAlice.transferAll(aliceRelayerAddress)
      expect(await alpacaToken.balanceOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.balanceOf(aliceRelayerAddress)).to.deep.equal(ethers.utils.parseEther('20'))
      expect(await alpacaToken.lockOf(aliceRelayerAddress)).to.deep.equal(ethers.utils.parseEther('100'))

      // Bob transferAll locked Alpaca token to relayer, so that we expect to see both of their balance and lock amount correct
      expect(await alpacaToken.balanceOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('50'))
      expect(await alpacaToken.balanceOf(bobRelayerAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(bobRelayerAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      await alpacaTokenAsBob.transferAll(bobRelayerAddress)
      expect(await alpacaToken.balanceOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.balanceOf(bobRelayerAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(bobRelayerAddress)).to.deep.equal(ethers.utils.parseEther('50'))

      // Alice hodl!
      expect(await alpacaToken.balanceOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('0'))
      await strongAlpacaAsAlice.hodl()
      expect(await alpacaToken.balanceOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('100'))
      expect(await alpacaToken.balanceOf(aliceRelayerAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(aliceRelayerAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.balanceOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('20'))
      expect(await alpacaToken.lockOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await strongAlpaca.balanceOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('100'))

      // Bob hodl!
      await strongAlpacaAsBob.hodl()
      expect(await alpacaToken.balanceOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('150'))
      expect(await alpacaToken.balanceOf(bobRelayerAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(bobRelayerAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.balanceOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await strongAlpaca.balanceOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('50'))

      // Evaluate the final balance of strongAlpaca
      expect(await strongAlpaca.totalSupply()).to.deep.equal(ethers.utils.parseEther('150'))
    })
  })

  context('when alice has already called prepareHodl once', async () => {
    it('should not allow to prepareHodl when user has already prepare hodl', async () => {
      await strongAlpacaAsAlice.prepareHodl()
      await expect(strongAlpacaAsAlice.prepareHodl())
        .to.be
        .revertedWith('StrongAlpaca::prepareHodl: user has already prepared hodl')
    })
  })

  context('when alice want to hodl StrongAlpaca after hodlableEndBlock', async () => {
    it('should not allow to do so when block.number exceeds hodlableEndBlock', async () => {
      await TimeHelpers.advanceBlockTo(nowBlock + 100)
      await expect(strongAlpacaAsAlice.prepareHodl())
        .to.be
        .revertedWith('StrongAlpaca::hodl: block.number exceeds hodlableEndBlock')
    })
  })

  context('when alice want to hodl StrongAlpaca but haven\'t prepare hodl', async () => {
    it('should not allow alice to do hodl', async () => {
      await expect(strongAlpacaAsAlice.hodl())
        .to.be
        .revertedWith('StrongAlpaca::hodl: user has not preapare hodl yet')
    })
  })

  context('when the relayer is created (prepareHodl)', async() => {
    it('should allow transferAllAlpaca to be called by only StrongAlpaca contract', async () => {
      const aliceAddress = await alice.getAddress()
      await strongAlpacaAsAlice.prepareHodl()
      const aliceRelayerAddress = await strongAlpaca.getRelayerAddress(aliceAddress)
      const relayerAsAlice = StrongAlpacaRelayer__factory.connect(aliceRelayerAddress, alice)
      const relayerAsBob = StrongAlpacaRelayer__factory.connect(aliceRelayerAddress, bob)

      await expect(relayerAsAlice.transferAllAlpaca())
        .to.be
        .revertedWith('Ownable: caller is not the owner')
      await expect(relayerAsBob.transferAllAlpaca())
        .to.be
        .revertedWith('Ownable: caller is not the owner')
      expect(await relayerAsAlice.owner()).to.be.equal(strongAlpaca.address)
    })
  })

  context('when alice and bob wants to unhodl', async() => {
    it('should swap Strong Alpaca with Alpaca successfully', async () => {
      const aliceAddress = await alice.getAddress()
      const bobAddress = await bob.getAddress()

      // mint alpaca for alice and bob
      await alpacaToken.mint(aliceAddress, ethers.utils.parseEther('120'))
      await alpacaToken.lock(aliceAddress, ethers.utils.parseEther('100'))
      await alpacaToken.mint(bobAddress, ethers.utils.parseEther('50'))
      await alpacaToken.lock(bobAddress, ethers.utils.parseEther('50'))

      // prepare hodl
      await strongAlpacaAsAlice.prepareHodl()
      const aliceRelayerAddress = await strongAlpaca.getRelayerAddress(aliceAddress)
      await strongAlpacaAsBob.prepareHodl()
      const bobRelayerAddress = await strongAlpaca.getRelayerAddress(bobAddress)

      // transfer alapace to relayer
      await alpacaTokenAsAlice.transferAll(aliceRelayerAddress)
      await alpacaTokenAsBob.transferAll(bobRelayerAddress)

      // hodl
      await strongAlpacaAsAlice.hodl()
      await strongAlpacaAsBob.hodl()

      // fast forward to the lockEndBlock
      await TimeHelpers.advanceBlockTo(nowBlock + 500)

      // locked token of StrongAlpaca should be 150
      expect(await alpacaToken.lockOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('150'))

      // alice unhodl
      expect(await strongAlpaca.balanceOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('100'))
      expect(await alpacaToken.balanceOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('20'))
      await strongAlpacaAsAlice.approve(strongAlpacaAsAlice.address, ethers.constants.MaxUint256)
      await strongAlpacaAsAlice.unhodl()
      expect(await strongAlpaca.balanceOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.balanceOf(aliceAddress)).to.deep.equal(ethers.utils.parseEther('120'))

      // locked token of StrongAlpaca should be 0, and the alpaca token should be (all - 100)
      expect(await alpacaToken.balanceOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('50'))
      expect(await alpacaToken.lockOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await strongAlpaca.balanceOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('100'))

      // bob unhodl
      expect(await strongAlpaca.balanceOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('50'))
      expect(await alpacaToken.balanceOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      await strongAlpacaAsBob.approve(strongAlpacaAsAlice.address, ethers.constants.MaxUint256)
      await strongAlpacaAsBob.unhodl()
      expect(await strongAlpaca.balanceOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.balanceOf(bobAddress)).to.deep.equal(ethers.utils.parseEther('50'))

      // StrongAlpaca balance should be 0 StrongAlpaca
      expect(await alpacaToken.balanceOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await alpacaToken.lockOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('0'))
      expect(await strongAlpaca.balanceOf(strongAlpaca.address)).to.deep.equal(ethers.utils.parseEther('150'))
    })
  })
})
