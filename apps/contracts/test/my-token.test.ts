import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import * as chai from "chai";
import { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import hre from "hardhat";
import { parseEventLogs } from "viem";
import { writeContract } from "viem/actions";

chai.use(chaiAsPromised);

const deploy = async () => {
  const [owner, user1, user2] = await hre.viem.getWalletClients();
  const myToken = await hre.viem.deployContract("MyToken", [], {
    client: { wallet: owner },
  });

  return { myToken, owner, user1, user2 };
};

describe("MyToken - Full ERC20 Test Suite", function () {
  it("should return correct name, symbol, and decimals", async function () {
    const { myToken } = await loadFixture(deploy);

    const name = await myToken.read.name();
    const symbol = await myToken.read.symbol();
    const decimals = await myToken.read.decimals();

    expect(name).to.be.a("string");
    expect(symbol).to.be.a("string");
    assert.equal(decimals, 18);
  });

  it("should mint tokens correctly", async function () {
    const { myToken, user1 } = await loadFixture(deploy);

    const amount = 1n;

    const initialSupply = await myToken.read.totalSupply();

    await myToken.write.mint([user1.account.address, amount]);

    const newSupply = await myToken.read.totalSupply();
    const balance = await myToken.read.balanceOf([user1.account.address]);
    expect(newSupply).eq(initialSupply + amount);
    expect(balance).eq(amount);
  });

  it("should transfer tokens correctly", async function () {
    const { myToken, owner, user1 } = await loadFixture(deploy);

    const mintAmount = 1000n;
    await myToken.write.mint([owner.account.address, mintAmount]);

    await myToken.write.transfer([user1.account.address, 500n]);

    const balanceOwner = await myToken.read.balanceOf([owner.account.address]);
    const balanceUser1 = await myToken.read.balanceOf([user1.account.address]);

    expect(balanceOwner).equal(500n);
    expect(balanceUser1).equal(500n);
  });

  it("should fail transfer with insufficient balance", async function () {
    const { myToken, user1, user2 } = await loadFixture(deploy);

    await expect(
      writeContract(user1, {
        abi: myToken.abi,
        address: myToken.address,
        functionName: "transfer",
        args: [user2.account.address, 100n],
      }),
    ).to.be.rejected;
  });

  it("should approve and check allowance", async function () {
    const { myToken, owner, user1 } = await loadFixture(deploy);

    await myToken.write.approve([user1.account.address, 500n]);

    const allowance = await myToken.read.allowance([
      owner.account.address,
      user1.account.address,
    ]);

    expect(allowance).equal(500n);
  });

  it("should allow transferFrom when approved", async function () {
    const { myToken, owner, user1 } = await loadFixture(deploy);

    const mintAmount = 1000n;
    await myToken.write.mint([owner.account.address, mintAmount]);

    await myToken.write.approve([user1.account.address, 300n]);

    await writeContract(user1, {
      abi: myToken.abi,
      address: myToken.address,
      functionName: "transferFrom",
      args: [owner.account.address, user1.account.address, 300n],
    });
    const ownerBalance = await myToken.read.balanceOf([owner.account.address]);
    const user1Balance = await myToken.read.balanceOf([user1.account.address]);
    const remainingAllowance = await myToken.read.allowance([
      owner.account.address,
      user1.account.address,
    ]);

    expect(ownerBalance).equal(700n);
    expect(user1Balance).equal(300n);
    expect(remainingAllowance).equal(0n);
  });

  it("should fail transferFrom without enough allowance", async function () {
    const { myToken, owner, user1 } = await loadFixture(deploy);
    await expect(
      writeContract(user1, {
        abi: myToken.abi,
        address: myToken.address,
        functionName: "transferFrom",
        args: [owner.account.address, user1.account.address, 1n],
      }),
    ).to.be.rejected;
  });

  it("should allow multiple transfers", async function () {
    const { myToken, owner, user1, user2 } = await loadFixture(deploy);

    await myToken.write.mint([owner.account.address, 1000n]);

    await myToken.write.transfer([user1.account.address, 400n]);
    await myToken.write.transfer([user2.account.address, 100n]);

    const ownerBalance = await myToken.read.balanceOf([owner.account.address]);
    const user1Balance = await myToken.read.balanceOf([user1.account.address]);
    const user2Balance = await myToken.read.balanceOf([user2.account.address]);

    expect(ownerBalance).equal(500n);
    expect(user1Balance).equal(400n);
    expect(user2Balance).equal(100n);
  });

  it("should transfer full balance", async function () {
    const { myToken, owner, user1 } = await loadFixture(deploy);

    await myToken.write.mint([owner.account.address, 250n]);
    await myToken.write.transfer([user1.account.address, 250n]);

    const ownerBalance = await myToken.read.balanceOf([owner.account.address]);
    const user1Balance = await myToken.read.balanceOf([user1.account.address]);

    expect(ownerBalance).equal(0n);
    expect(user1Balance).equal(250n);
  });

  it("should allow approved user to spend partially", async function () {
    const { myToken, owner, user1 } = await loadFixture(deploy);

    await myToken.write.mint([owner.account.address, 1000n]);
    await myToken.write.approve([user1.account.address, 500n]);

    await writeContract(user1, {
      abi: myToken.abi,
      address: myToken.address,
      functionName: "transferFrom",
      args: [owner.account.address, user1.account.address, 200n],
    });

    const remainingAllowance = await myToken.read.allowance([
      owner.account.address,
      user1.account.address,
    ]);
    const ownerBalance = await myToken.read.balanceOf([owner.account.address]);
    const user1Balance = await myToken.read.balanceOf([user1.account.address]);

    expect(remainingAllowance).equal(300n);
    expect(ownerBalance).equal(800n);
    expect(user1Balance).equal(200n);
  });

  it("should emit Transfer event", async function () {
    const { myToken, owner, user1 } = await loadFixture(deploy);

    await myToken.write.mint([owner.account.address, 100n]);

    const hash = await myToken.write.transfer([user1.account.address, 100n]);
    const publicClient = await hre.viem.getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    const logs = parseEventLogs({
      abi: myToken.abi,
      logs: receipt.logs,
    });

    const transferEvent = logs.find((log) => log.eventName === "Transfer");

    expect(transferEvent).to.exist;
    expect(transferEvent?.args?.from.toLowerCase()).to.equal(
      owner.account.address.toLowerCase(),
    );
    expect(transferEvent?.args?.to.toLowerCase()).to.equal(
      user1.account.address.toLowerCase(),
    );
    expect(transferEvent?.args?.value).to.equal(100n);
  });

  it("should emit Approval event", async function () {
    const { myToken, owner, user1 } = await loadFixture(deploy);

    const hash = await myToken.write.approve([user1.account.address, 123n]);
    const publicClient = await hre.viem.getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const logs = parseEventLogs({
      abi: myToken.abi,
      logs: receipt.logs,
    });

    const approvalEvent = logs.find((log) => log.eventName === "Approval");
    expect(approvalEvent).to.exist;
    expect(approvalEvent?.args?.owner.toLowerCase()).to.equal(
      owner.account.address.toLowerCase(),
    );
    expect(approvalEvent?.args?.spender.toLowerCase()).to.equal(
      user1.account.address.toLowerCase(),
    );
    expect(approvalEvent?.args?.value).to.equal(123n);
  });

  it("should overwrite allowance when approving again", async () => {
    const { myToken, owner, user1 } = await loadFixture(deploy);

    await myToken.write.approve([user1.account.address, 100n]);
    await myToken.write.approve([user1.account.address, 50n]);

    const allowance = await myToken.read.allowance([
      owner.account.address,
      user1.account.address,
    ]);
    expect(allowance).equal(50n);
  });

  it("should allow partial spends with transferFrom", async () => {
    const { myToken, owner, user1 } = await loadFixture(deploy);

    await myToken.write.mint([owner.account.address, 1000n]);
    await myToken.write.approve([user1.account.address, 400n]);

    await writeContract(user1, {
      abi: myToken.abi,
      address: myToken.address,
      functionName: "transferFrom",
      args: [owner.account.address, user1.account.address, 100n],
    });

    await writeContract(user1, {
      abi: myToken.abi,
      address: myToken.address,
      functionName: "transferFrom",
      args: [owner.account.address, user1.account.address, 300n],
    });

    const remaining = await myToken.read.allowance([
      owner.account.address,
      user1.account.address,
    ]);
    expect(remaining).equal(0n);
  });

  it("should handle approve reset to zero and new value", async () => {
    const { myToken, owner, user1 } = await loadFixture(deploy);

    await myToken.write.approve([user1.account.address, 100n]);
    await myToken.write.approve([user1.account.address, 0n]);
    await myToken.write.approve([user1.account.address, 200n]);

    const allowance = await myToken.read.allowance([
      owner.account.address,
      user1.account.address,
    ]);
    expect(allowance).equal(200n);
  });

  it("should allow self-transfer", async () => {
    const { myToken, user1 } = await loadFixture(deploy);

    await myToken.write.mint([user1.account.address, 123n]);
    await writeContract(user1, {
      abi: myToken.abi,
      address: myToken.address,
      functionName: "transfer",
      args: [user1.account.address, 123n],
    });

    const balance = await myToken.read.balanceOf([user1.account.address]);
    expect(balance).equal(123n);
  });

  it("should allow transferFrom to self", async () => {
    const { myToken, owner } = await loadFixture(deploy);

    await myToken.write.mint([owner.account.address, 100n]);
    await myToken.write.approve([owner.account.address, 100n]);

    await writeContract(owner, {
      abi: myToken.abi,
      address: myToken.address,
      functionName: "transferFrom",
      args: [owner.account.address, owner.account.address, 100n],
    });

    const balance = await myToken.read.balanceOf([owner.account.address]);
    expect(balance).equal(100n);
  });
});
