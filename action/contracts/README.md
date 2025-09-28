# SecretBallotBox Smart Contracts

This directory contains the smart contracts for the SecretBallotBox privacy-preserving voting platform.

## 📋 Overview

The SecretBallotBox contract enables fully private voting using FHEVM (Fully Homomorphic Encryption Virtual Machine) technology. Votes are encrypted on the client side and remain encrypted throughout the voting process, ensuring complete privacy until results are revealed.

## 🏗️ Contract Architecture

### SecretBallotBox.sol

The main contract provides the following functionality:

#### Core Features
- **Ballot Creation**: Create new voting ballots with customizable parameters
- **Encrypted Voting**: Cast votes using encrypted candidate indices
- **Results Revelation**: Decrypt and reveal final vote counts
- **Access Control**: Prevent double voting and unauthorized access

#### Key Functions

```solidity
// Create a new ballot
function createBallot(
    string calldata title,
    string[] calldata candidates,
    uint256 durationMinutes
) external returns (uint256 ballotId)

// Cast an encrypted vote
function vote(
    uint256 ballotId,
    externalEuint8 encryptedCandidateIndex,
    bytes calldata inputProof
) external

// Reveal ballot results (decrypt vote counts)
function revealResults(uint256 ballotId) external

// Get ballot information
function getBallotInfo(uint256 ballotId) external view returns (...)

// Get final results (after revelation)
function getResults(uint256 ballotId) external view returns (uint256[] memory)
```

## 🚀 Quick Start

### Prerequisites

```bash
npm install
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy Locally

```bash
# Start local FHEVM node
npx hardhat node

# Deploy in another terminal
npx hardhat --network localhost deploy
```

## 🧪 Testing & Interaction

### Automated Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/SecretBallotBox.ts
```

### Interactive Commands

#### Create a Ballot
```bash
npx hardhat --network localhost task:create-ballot \
  --title "Presidential Election 2024" \
  --candidates "Alice,Bob,Charlie" \
  --duration 1440  # 24 hours in minutes
```

#### Cast a Vote
```bash
npx hardhat --network localhost task:vote \
  --ballot-id 0 \
  --candidate-index 1  # Vote for Bob (index 1)
```

#### Reveal Results
```bash
npx hardhat --network localhost task:reveal-results \
  --ballot-id 0
```

#### View Results
```bash
npx hardhat --network localhost task:get-results \
  --ballot-id 0
```

#### List All Ballots
```bash
npx hardhat --network localhost task:list-ballots
```

## 🔧 Configuration

### Networks

The project supports multiple networks:

- **localhost**: Local Hardhat node (Chain ID: 31337)
- **sepolia**: Sepolia testnet (Chain ID: 11155111)

### Environment Variables

Set up your environment variables:

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
MNEMONIC="your twelve word mnemonic phrase here"
INFURA_API_KEY="your_infura_api_key"
ETHERSCAN_API_KEY="your_etherscan_api_key"
```

Or use Hardhat's variable system:

```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY
```

## 📊 Contract Details

### Data Structures

```solidity
struct Ballot {
    string title;                           // Ballot title
    string[] candidates;                    // List of candidates
    uint256 endTime;                        // Voting end timestamp
    bool isActive;                          // Whether ballot is active
    bool resultsRevealed;                   // Whether results are revealed
    address creator;                        // Ballot creator
    uint256 totalVotes;                     // Total votes cast
    mapping(uint256 => euint32) encryptedVotes;  // Encrypted vote counts
    mapping(uint256 => uint32) finalResults;     // Final results (after decryption)
    mapping(address => bool) hasVoted;           // Voting status per address
}
```

### Events

```solidity
event BallotCreated(uint256 indexed ballotId, string title, address indexed creator, uint256 endTime);
event VoteCast(uint256 indexed ballotId, address indexed voter);
event ResultsRevealed(uint256 indexed ballotId, uint256[] results);
```

### Security Features

1. **Double Voting Prevention**: Each address can only vote once per ballot
2. **Time-based Access Control**: Voting only allowed during active period
3. **Encrypted Vote Storage**: Individual votes remain private until revelation
4. **Access Control Lists**: Only authorized parties can decrypt specific data

## 🛡️ Security Considerations

### Vote Privacy
- Votes are encrypted using FHEVM before being stored
- Individual vote choices cannot be determined until results are revealed
- No correlation between voter address and vote choice is possible

### Access Control
- Ballot creators cannot see individual votes
- Only the voter and contract can access encrypted vote data
- Results can only be revealed after the voting period ends

### Validation
- Input validation prevents invalid candidate indices
- Time-based checks ensure votes are only cast during active periods
- Duplicate voting is prevented through address tracking

## 📈 Gas Optimization

The contract is optimized for gas efficiency:

- Uses `euint8` for candidate indices (supports up to 256 candidates)
- Efficient storage patterns for ballot data
- Batch operations where possible
- Minimal external calls

## 🔍 Verification

### Contract Verification on Etherscan

```bash
# Deploy to Sepolia
npx hardhat --network sepolia deploy

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Local Verification

```bash
# Check deployment
npx hardhat --network localhost task:address

# Verify contract functionality
npx hardhat --network localhost task:list-ballots
```

## 📚 Additional Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)

## 🐛 Troubleshooting

### Common Issues

1. **"Ballot does not exist"**: Check ballot ID is valid
2. **"Already voted"**: Each address can only vote once per ballot
3. **"Ballot has ended"**: Voting is only allowed during active period
4. **"Invalid candidate index"**: Candidate index must be within bounds

### Debug Commands

```bash
# Check contract address
npx hardhat --network localhost task:address

# List all ballots
npx hardhat --network localhost task:list-ballots

# Check specific ballot info
npx hardhat --network localhost task:get-results --ballot-id 0
```

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new functionality
3. Update documentation as needed
4. Ensure all tests pass before submitting

---

**For more information, see the main project README.**


