import "@nomicfoundation/hardhat-ignition-viem";

import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";

dotenv.config({ path: `${process.cwd()}/env/.env` });

const mnemonic: string | undefined = process.env["BLOCKCHAIN_MNEMONIC"];
if (!mnemonic) {
  throw new Error("Please set your BLOCKCHAIN_MNEMONIC in a .env file");
}

function getUrl(chain: keyof typeof chainIds): string {
  switch (chain) {
    case "ganache":
      return "http://localhost:8545";
    case "sepolia":
      return "https://ethereum-sepolia-rpc.publicnode.com";
    case "polygon-mumbai":
      return "https://rpc-mumbai.maticvigil.com";
    default:
      throw new Error(
        `Unsupported chain "${chain}". Please add its RPC URL to getUrl().`,
      );
  }
}

const chainIds = {
  hardhat: 31337,
  "polygon-mumbai": 80001,
  sepolia: 11155111,
  ganache: 1337,
};

const etherscanApiKey = {
  ["polygon-mumbai"]: process.env["BLOCKCHAIN_POLYGONSCAN_API_KEY"] || "",
  sepolia: process.env["BLOCKCHAIN_ETHERSCAN_API_KEY"] || "",
  hardhat: undefined,
  ganache: undefined,
};

const etherscanApiUrl = {
  ["polygon-mumbai"]: undefined,
  sepolia: "https://api-sepolia.etherscan.io/",
  hardhat: undefined,
  ganache: undefined,
};

function getChainConfig(chain: keyof typeof chainIds): NetworkUserConfig {
  const jsonRpcUrl = getUrl(chain);
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[chain],
    url: jsonRpcUrl,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: 31337,
    },
    sepolia: getChainConfig("sepolia"),
    "polygon-mumbai": getChainConfig("polygon-mumbai"),
    ganache: getChainConfig("ganache"),
  },
  solidity: "0.8.26",
  paths: {
    artifacts: "./artifacts",
    cache: "./utils",
    sources: "./src",
    tests: "./test",
  },
};

export default config;
