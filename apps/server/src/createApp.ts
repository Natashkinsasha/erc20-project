import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import { createWalletClient, getContract, http, parseAbi } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

dotenv.config({ path: `${process.cwd()}/env/.env` });

const abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
]);

export function createApp() {
  const app = express();
  app.use(express.json());

  const mnemonic = process.env.BLOCKCHAIN_MNEMONIC;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!mnemonic || !contractAddress) {
    throw new Error("Environment variables BLOCKCHAIN_MNEMONIC or CONTRACT_ADDRESS are missing.");
  }

  const account = mnemonicToAccount(mnemonic);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });

  const contract = getContract({
    address: contractAddress as `0x${string}`,
    abi,
    client: walletClient,
  });

  app.get("/token", async (_: Request, res: Response, next: NextFunction) => {
    const [name, symbol, totalSupply] = await Promise.all([
      contract.read.name(),
      contract.read.symbol(),
      contract.read.totalSupply(),
    ]);
    res.json({ name, symbol, totalSupply: totalSupply.toString() });
  });

  app.get("/balance/:address", async (req: Request<{ address: `0x${string}` }>, res: Response, next: NextFunction) => {
    const balance = await contract.read.balanceOf([req.params.address]);
    res.json({ balance: balance.toString() });
  });

  app.post("/transferFrom", async (req: Request, res: Response, next: NextFunction) => {
    const { from, to, amount } = req.body;
    const hash = await contract.write.transferFrom([from, to, BigInt(amount)]);
    res.json({ hash });
  });

  app.post("/mint", async (req: Request, res: Response, next: NextFunction) => {
    const { to, amount } = req.body;
    const hash = await contract.write.mint([to, BigInt(amount)]);
    res.json({ hash });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  return app;
}
