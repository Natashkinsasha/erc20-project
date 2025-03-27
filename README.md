## ⚠️ Disclaimer

**This project provides minimal functionality and is not suitable for production use without significant modifications.**

- A **mnemonic phrase is stored in plaintext** for convenience and quick project startup. **This is never acceptable in real-world applications.** The wallet contains **no real-value cryptocurrency**.
- The API **lacks authentication**, which is critical for sensitive endpoints such as **minting** and **transfers**. This is done solely for demonstration purposes.

---

# ERC20 Project

This project is a monorepo that includes:

- A **Node.js/TypeScript server** exposing a REST API to interact with an ERC20 token contract
- A **Hardhat setup** to compile, test, and deploy smart contracts (with [Ignition](https://hardhat.org/ignition))

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment

Create a file at `env/.env`:

```env
BLOCKCHAIN_MNEMONIC="your 12-word mnemonic"
CONTRACT_ADDRESS="0xYourDeployedContractAddress"
```

### 3. Compile contracts

```bash
npm run compile-contracts
```

### 4. Deploy contracts to Sepolia testnet

```bash
npm run deploy-contracts-sepolia
```

### 5. Start the server

Development mode (with ts-node):

```bash
npm run start-server
```

Production mode (after build):

```bash
npm run build-server
npm run serve-server
```

---

## 🧪 Running Tests

Smart contracts:

```bash
npm run test-contracts
```

Server:

```bash
npm run test-server
```

---

## 🧾 API Endpoints

### `GET /token`

Returns basic token metadata.

```json
{
  "name": "MyToken",
  "symbol": "MTK",
  "totalSupply": "1000000"
}
```

### `GET /balance/:address`

Returns the balance of a given wallet address.

```json
{
  "balance": "500"
}
```

### `POST /transferFrom`

Transfers tokens from one address to another. Requires the `from` address to have approved the server's signer.

**Body:**

```json
{
  "from": "0xFromAddress",
  "to": "0xToAddress",
  "amount": "100"
}
```

**Response:**

```json
{
  "hash": "0xTransactionHash"
}
```

### `POST /mint`

Mints new tokens to a specific address. Only callable by the owner (contract's signer).

**Body:**

```json
{
  "to": "0xRecipientAddress",
  "amount": "1000"
}
```

**Response:**

```json
{
  "hash": "0xTransactionHash"
}
```

---

## 🧹 Linting

Auto-fix code style issues:

```bash
npm run lint
```

---

## 🛠 Built With

- [TypeScript](https://www.typescriptlang.org/)
- [Express](https://expressjs.com/)
- [Hardhat](https://hardhat.org/)
- [Viem](https://viem.sh/)
- [Mocha](https://mochajs.org/) + [Chai](https://www.chaijs.com/)

---

## 📄 License

ISC License

---