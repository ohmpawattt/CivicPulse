# SecretBallotBox Frontend

Modern, responsive web application for the SecretBallotBox privacy-preserving voting platform.

## 🌟 Features

### 🎨 Modern UI/UX
- **Clean Design**: Minimalist interface with blue/green gradient theme
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Fade-in, slide-up, and hover effects
- **Accessibility**: Keyboard navigation and screen reader support

### 🔐 Privacy-First Experience
- **Encrypted Voting**: Client-side vote encryption before submission
- **Anonymous Interface**: No personal information required beyond wallet address
- **Privacy Indicators**: Clear visual feedback about encryption status
- **Secure Connections**: Direct blockchain interaction without intermediaries

### 🚀 Real-Time Features
- **Live Updates**: Automatic refresh of ballot status and vote counts
- **Progress Tracking**: Real-time voting progress and time remaining
- **Instant Feedback**: Immediate confirmation of actions and transactions
- **Error Handling**: Clear error messages and recovery suggestions

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 RC
- **Styling**: Tailwind CSS with custom components
- **Charts**: Recharts for vote result visualization
- **Blockchain**: ethers.js v6 for Web3 interaction
- **Encryption**: FHEVM MockFhevmInstance for development

### Component Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Main voting dashboard
│   ├── providers.tsx            # React context providers
│   └── globals.css              # Global styles and utilities
│
├── components/                   # UI Components
│   ├── BallotCard.tsx           # Individual ballot display
│   ├── VotingModal.tsx          # Vote casting interface
│   ├── ResultsModal.tsx         # Results visualization
│   └── CreateBallotModal.tsx    # Ballot creation form
│
├── hooks/                       # Custom React Hooks
│   ├── useSecretBallotBox.tsx   # Contract interaction logic
│   └── metamask/                # MetaMask integration
│       └── useMetaMaskEthersSigner.tsx
│
├── fhevm/                       # FHEVM Integration
│   ├── useFhevm.tsx            # FHEVM instance management
│   ├── fhevmTypes.ts           # TypeScript type definitions
│   └── internal/               # Internal FHEVM utilities
│       ├── fhevm.ts            # Instance creation logic
│       └── mock/               # Mock implementation for development
│
└── abi/                        # Generated contract interfaces
    ├── SecretBallotBoxABI.ts   # Contract ABI (auto-generated)
    └── SecretBallotBoxAddresses.ts # Deployment addresses
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- Running SecretBallotBox contracts (see `/contracts` directory)

### Installation

```bash
# Install dependencies
npm install

# Generate ABI files (after deploying contracts)
npm run genabi

# Start development server
npm run dev
```

### Environment Setup

The application automatically connects to:
- **Local Development**: `http://localhost:8545` (Hardhat node)
- **Chain ID**: 31337 (local) or 11155111 (Sepolia)

## 🎯 Usage Guide

### Connecting Wallet

1. **Install MetaMask**: Ensure MetaMask extension is installed
2. **Add Local Network**: Configure MetaMask for local FHEVM node
   - Network Name: "Local FHEVM"
   - RPC URL: "http://localhost:8545"
   - Chain ID: 31337
   - Currency Symbol: "ETH"
3. **Import Account**: Use a private key from Hardhat node output
4. **Connect**: Click "Connect MetaMask" in the application

### Creating Ballots

1. **Click "Create Ballot"**: Opens the ballot creation modal
2. **Fill Details**:
   - **Title**: Descriptive name for your election
   - **Candidates**: Add 2-10 candidate names
   - **Duration**: Set voting period (minutes/hours/days)
3. **Review**: Check all details before submission
4. **Submit**: Sign the transaction to create the ballot

### Voting Process

1. **Find Active Ballot**: Browse active ballots on the dashboard
2. **Click "Cast Encrypted Vote"**: Opens the voting modal
3. **Select Candidate**: Choose your preferred candidate
4. **Review Choice**: Confirm your selection (cannot be changed)
5. **Submit Vote**: Sign the encrypted vote transaction
6. **Confirmation**: Wait for blockchain confirmation

### Viewing Results

1. **Wait for End**: Ballots must end before results can be revealed
2. **Reveal Results**: Any user can trigger result revelation
3. **View Results**: Click "View Results" to see vote distribution
4. **Analyze Data**: View charts, percentages, and winner information

## 🎨 Design System

### Color Palette

```css
/* Primary Colors */
--primary-50: #eff6ff;    /* Light blue backgrounds */
--primary-500: #3b82f6;   /* Primary buttons and links */
--primary-700: #1d4ed8;   /* Hover states */

/* Success Colors */
--success-500: #22c55e;   /* Success states and active indicators */
--success-600: #16a34a;   /* Success button hover */

/* Status Colors */
--warning-500: #f59e0b;   /* Warning states */
--danger-500: #ef4444;    /* Error states */
--info-500: #3b82f6;      /* Information states */
```

### Typography

- **Headings**: Inter font family, bold weights
- **Body**: Inter font family, regular weight
- **Code**: Fira Code monospace font

### Component Classes

```css
/* Buttons */
.btn-primary     /* Primary action buttons */
.btn-secondary   /* Secondary action buttons */
.btn-outline     /* Outline buttons */
.btn-danger      /* Destructive actions */

/* Cards */
.card            /* Base card component */
.card-header     /* Card header section */
.card-title      /* Card title text */

/* Badges */
.badge-success   /* Success status badges */
.badge-warning   /* Warning status badges */
.badge-info      /* Information badges */
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Testing
npm run test         # Run Vitest tests
npm run test:ui      # Run tests with UI

# Contract Integration
npm run genabi       # Generate ABI files from contracts
```

### Key Hooks

#### `useSecretBallotBox`

Main hook for contract interaction:

```typescript
const ballotBox = useSecretBallotBox({
  instance: fhevmInstance,
  chainId,
  ethersSigner,
  ethersReadonlyProvider,
  sameChain,
  sameSigner,
});

// Available methods
ballotBox.createBallot(title, candidates, duration);
ballotBox.vote(ballotId, candidateIndex);
ballotBox.revealResults(ballotId);
ballotBox.getBallotResults(ballotId);
```

#### `useFhevm`

FHEVM instance management:

```typescript
const { instance, status, error } = useFhevm({
  provider,
  chainId,
  initialMockChains: { 31337: "http://localhost:8545" },
  enabled: true,
});
```

#### `useMetaMaskEthersSigner`

MetaMask integration:

```typescript
const {
  provider,
  chainId,
  accounts,
  isConnected,
  connect,
  ethersSigner,
} = useMetaMaskEthersSigner();
```

### State Management

The application uses React's built-in state management:

- **Context Providers**: For wallet and FHEVM instances
- **Custom Hooks**: For contract and business logic
- **Local State**: For UI components and modals

### FHEVM Integration

```typescript
// Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add8(candidateIndex);

// Encrypt and get proof
const encrypted = await input.encrypt();

// Submit to contract
await contract.vote(ballotId, encrypted.handles[0], encrypted.inputProof);
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Integration Testing

```bash
# Test with local contracts
npm run dev
# Then manually test the full workflow
```

### E2E Testing

Manual testing workflow:
1. Connect MetaMask
2. Create a test ballot
3. Cast votes from different accounts
4. Reveal results
5. Verify vote counts and privacy

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

For production deployment:

```bash
# Set in your deployment platform
NEXT_PUBLIC_DEFAULT_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

## 🔍 Debugging

### Common Issues

1. **MetaMask Connection Fails**
   - Check network configuration
   - Verify chain ID matches
   - Ensure MetaMask is unlocked

2. **FHEVM Instance Error**
   - Confirm contracts are deployed
   - Check Hardhat node is running
   - Verify contract addresses

3. **Transaction Failures**
   - Check gas limits
   - Verify contract permissions
   - Ensure sufficient balance

### Debug Tools

```bash
# Check contract deployment
npm run genabi

# Verify contract addresses
console.log(SecretBallotBoxAddresses);

# Check FHEVM status
console.log(fhevmStatus, fhevmError);
```

## 🎯 Performance

### Optimization Features

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Lazy Loading**: Components loaded on demand

### Bundle Size

- **Main Bundle**: ~200KB gzipped
- **FHEVM Mock**: Dynamically imported (development only)
- **Charts**: Lazy loaded for results view

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow ESLint and Prettier configuration
2. **TypeScript**: Use strict type checking
3. **Components**: Keep components small and focused
4. **Hooks**: Extract logic into custom hooks
5. **Testing**: Add tests for new features

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit pull request

---

**For more information, see the main project README.**


