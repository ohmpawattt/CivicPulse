# SecretBallotBox - Privacy-Preserving Voting Platform

🗳️ **SecretBallotBox** is a fully decentralized, privacy-preserving voting platform built on FHEVM (Fully Homomorphic Encryption Virtual Machine) technology. It enables secure, anonymous voting where individual votes remain encrypted throughout the entire process, ensuring complete privacy while maintaining transparency and auditability.

## 🌟 Features

### 🔐 Privacy-First Architecture
- **End-to-End Encryption**: All votes are encrypted using FHEVM technology
- **Anonymous Voting**: Individual votes remain private and untraceable
- **Homomorphic Computation**: Vote counting happens on encrypted data
- **Zero-Knowledge Privacy**: No one can see individual votes until results are revealed

### 🏛️ Democratic Transparency
- **Public Verification**: Anyone can verify the election process
- **Immutable Records**: All voting data is stored on blockchain
- **Open Source**: Fully auditable smart contracts and frontend code
- **Decentralized**: No single point of failure or control

### 🚀 Modern User Experience
- **Intuitive Interface**: Clean, modern UI built with Next.js and Tailwind CSS
- **Real-Time Updates**: Live ballot status and vote counts
- **Mobile Responsive**: Works seamlessly on all devices
- **MetaMask Integration**: Easy wallet connection and transaction signing

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Smart Contract  │    │     FHEVM       │
│   (Next.js)     │◄──►│ (SecretBallotBox)│◄──►│   (Encryption)  │
│                 │    │                  │    │                 │
│ • Voting UI     │    │ • Ballot Logic   │    │ • Vote Encryption│
│ • Results View  │    │ • Access Control │    │ • Homomorphic   │
│ • MetaMask      │    │ • Event Emission │    │   Operations    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
action/
├── contracts/                 # Smart Contract Layer
│   ├── contracts/
│   │   └── SecretBallotBox.sol    # Main voting contract
│   ├── deploy/
│   │   └── deploy-secretballotbox.ts  # Deployment script
│   ├── tasks/
│   │   └── SecretBallotBox.ts     # Hardhat tasks
│   ├── test/
│   │   └── SecretBallotBox.ts     # Contract tests
│   └── package.json
│
└── frontend/                  # Frontend Application
    ├── app/
    │   ├── layout.tsx             # Root layout
    │   ├── page.tsx               # Main page
    │   └── providers.tsx          # React providers
    ├── components/
    │   ├── BallotCard.tsx         # Ballot display component
    │   ├── VotingModal.tsx        # Voting interface
    │   ├── ResultsModal.tsx       # Results display
    │   └── CreateBallotModal.tsx  # Ballot creation
    ├── hooks/
    │   ├── useSecretBallotBox.tsx # Contract interaction
    │   └── metamask/              # Wallet integration
    ├── fhevm/
    │   ├── useFhevm.tsx          # FHEVM instance management
    │   └── internal/             # FHEVM internals
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- Git

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd action

# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Local FHEVM Node

```bash
# In contracts directory
cd contracts
npx hardhat node
```

This starts a local Hardhat node with FHEVM support on `http://localhost:8545`

### 3. Deploy Smart Contracts

```bash
# In a new terminal, deploy contracts
cd contracts
npx hardhat --network localhost deploy

# Verify deployment
npx hardhat --network localhost task:address
```

### 4. Generate ABI Files

```bash
# In frontend directory
cd frontend
npm run genabi
```

### 5. Start Frontend

```bash
# In frontend directory
npm run dev
```

Visit `http://localhost:3000` to access the application.

### 6. Connect MetaMask

1. Open MetaMask and add the local network:
   - Network Name: `Local FHEVM`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. Import a test account using one of the private keys from Hardhat node output

3. Connect your wallet to the application

## 📖 Usage Guide

### Creating a Ballot

1. Click **"Create Ballot"** button
2. Fill in ballot details:
   - **Title**: Election name
   - **Candidates**: Add 2-10 candidates
   - **Duration**: Set voting period
3. Click **"Create Ballot"** to deploy

### Voting Process

1. Find an active ballot
2. Click **"Cast Encrypted Vote"**
3. Select your candidate
4. Confirm the encrypted vote submission
5. Wait for transaction confirmation

### Viewing Results

1. Wait for ballot to end
2. Someone must call **"Reveal Results"** (any user can do this)
3. Click **"View Results"** to see final vote counts
4. Results display winner and vote distribution

## 🧪 Testing

### Contract Tests

```bash
cd contracts
npm test
```

### Interactive Testing

```bash
# Create a test ballot
npx hardhat --network localhost task:create-ballot \
  --title "Test Election" \
  --candidates "Alice,Bob,Charlie" \
  --duration 60

# Cast a vote
npx hardhat --network localhost task:vote \
  --ballot-id 0 \
  --candidate-index 1

# Reveal results (after ballot ends)
npx hardhat --network localhost task:reveal-results \
  --ballot-id 0

# View results
npx hardhat --network localhost task:get-results \
  --ballot-id 0
```

## 🔧 Development

### Smart Contract Development

The main contract `SecretBallotBox.sol` provides:

- **Ballot Creation**: `createBallot(title, candidates, duration)`
- **Encrypted Voting**: `vote(ballotId, encryptedCandidateIndex, proof)`
- **Results Revelation**: `revealResults(ballotId)`
- **Access Control**: Prevents double voting and unauthorized access

### Frontend Development

Key components:

- **`useFhevm`**: Manages FHEVM instance and encryption
- **`useSecretBallotBox`**: Handles contract interactions
- **`BallotCard`**: Displays ballot information
- **Modal Components**: Handle user interactions

### FHEVM Integration

The application uses MockFhevmInstance for local development:

```typescript
import { MockFhevmInstance } from "@fhevm/mock-utils";

// Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add8(candidateIndex);
const encrypted = await input.encrypt();

// Submit to contract
await contract.vote(ballotId, encrypted.handles[0], encrypted.inputProof);
```

## 🛡️ Security Features

### Vote Privacy
- Votes are encrypted client-side before submission
- Only encrypted data is stored on-chain
- Individual votes cannot be decrypted until results are revealed
- No correlation between voter address and vote choice

### Access Control
- Each address can only vote once per ballot
- Only authorized users can decrypt specific vote counts
- Results can only be revealed after ballot ends
- Smart contract enforces all security rules

### Auditability
- All transactions are recorded on blockchain
- Smart contract code is open source and verifiable
- Vote counts can be independently verified after revelation
- Complete transparency of the voting process

## 🌐 Deployment

### Local Development
- Uses Hardhat local node with FHEVM support
- MockFhevmInstance for testing encryption/decryption
- Instant transactions and easy debugging

### Testnet Deployment
- Deploy to Sepolia or other FHEVM-supported testnets
- Use real Relayer SDK for production-like testing
- Test with real network conditions

### Production Deployment
- Deploy to FHEVM mainnet when available
- Configure proper Relayer endpoints
- Set up monitoring and analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Zama**: For FHEVM technology and tools
- **Hardhat**: For development framework
- **Next.js**: For frontend framework
- **Tailwind CSS**: For styling system

## 📞 Support

For questions, issues, or contributions:

- Open an issue on GitHub
- Check existing documentation
- Review the code examples

---

**Built with ❤️ using FHEVM technology for a more private and secure voting future.**


