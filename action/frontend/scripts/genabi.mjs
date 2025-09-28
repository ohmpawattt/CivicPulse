#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const CONTRACTS_DIR = path.join(__dirname, '../../contracts');
const DEPLOYMENTS_DIR = path.join(CONTRACTS_DIR, 'deployments');
const ABI_OUTPUT_DIR = path.join(__dirname, '../abi');
const ARTIFACTS_DIR = path.join(CONTRACTS_DIR, 'artifacts/contracts');

// Ensure output directory exists
if (!fs.existsSync(ABI_OUTPUT_DIR)) {
  fs.mkdirSync(ABI_OUTPUT_DIR, { recursive: true });
}

// Contract names to process
const CONTRACTS = ['SecretBallotBox'];

function generateABI(contractName) {
  console.log(`Generating ABI for ${contractName}...`);
  
  // Read ABI from artifacts
  const artifactPath = path.join(ARTIFACTS_DIR, `${contractName}.sol`, `${contractName}.json`);
  
  if (!fs.existsSync(artifactPath)) {
    console.warn(`Artifact not found for ${contractName} at ${artifactPath}`);
    return;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;

  // Generate ABI file
  const abiContent = `// This file is auto-generated. Do not edit manually.
// Generated from ${contractName}.sol artifact

export const ${contractName}ABI = {
  abi: ${JSON.stringify(abi, null, 2)}
} as const;

export type ${contractName}ABIType = typeof ${contractName}ABI;
`;

  const abiFilePath = path.join(ABI_OUTPUT_DIR, `${contractName}ABI.ts`);
  fs.writeFileSync(abiFilePath, abiContent);
  console.log(`✅ Generated ABI: ${abiFilePath}`);
}

function generateAddresses(contractName) {
  console.log(`Generating addresses for ${contractName}...`);
  
  const addressesMap = {};

  // Check if deployments directory exists
  if (!fs.existsSync(DEPLOYMENTS_DIR)) {
    console.warn(`Deployments directory not found: ${DEPLOYMENTS_DIR}`);
    generateEmptyAddresses(contractName);
    return;
  }

  // Read all network deployments
  const networks = fs.readdirSync(DEPLOYMENTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const network of networks) {
    const deploymentPath = path.join(DEPLOYMENTS_DIR, network, `${contractName}.json`);
    
    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      
      // Map network names to chain IDs
      const chainIdMap = {
        'localhost': 31337,
        'hardhat': 31337,
        'sepolia': 11155111,
        'mainnet': 1,
      };

      const chainId = chainIdMap[network] || parseInt(network);
      
      addressesMap[chainId] = {
        address: deployment.address,
        chainId: chainId,
        chainName: network.charAt(0).toUpperCase() + network.slice(1),
      };
    }
  }

  // Generate addresses file
  const addressesContent = `// This file is auto-generated. Do not edit manually.
// Generated from deployment artifacts

export const ${contractName}Addresses = ${JSON.stringify(addressesMap, null, 2)} as const;

export type ${contractName}AddressesType = typeof ${contractName}Addresses;

// Helper function to get contract info by chain ID
export function get${contractName}ByChainId(chainId: number | undefined) {
  if (!chainId) {
    return { abi: [] };
  }
  
  const entry = ${contractName}Addresses[chainId.toString() as keyof typeof ${contractName}Addresses];
  
  if (!entry || !("address" in entry)) {
    return { abi: [], chainId };
  }
  
  return {
    address: entry.address as \`0x\${string}\`,
    chainId: entry.chainId,
    chainName: entry.chainName,
    abi: [], // ABI should be imported separately
  };
}
`;

  const addressesFilePath = path.join(ABI_OUTPUT_DIR, `${contractName}Addresses.ts`);
  fs.writeFileSync(addressesFilePath, addressesContent);
  console.log(`✅ Generated addresses: ${addressesFilePath}`);
}

function generateEmptyAddresses(contractName) {
  const addressesContent = `// This file is auto-generated. Do not edit manually.
// No deployments found - using empty addresses map

export const ${contractName}Addresses = {} as const;

export type ${contractName}AddressesType = typeof ${contractName}Addresses;

// Helper function to get contract info by chain ID
export function get${contractName}ByChainId(chainId: number | undefined) {
  if (!chainId) {
    return { abi: [] };
  }
  
  return {
    abi: [],
    chainId,
    chainName: 'Unknown',
  };
}
`;

  const addressesFilePath = path.join(ABI_OUTPUT_DIR, `${contractName}Addresses.ts`);
  fs.writeFileSync(addressesFilePath, addressesContent);
  console.log(`⚠️  Generated empty addresses (no deployments found): ${addressesFilePath}`);
}

function generateIndexFile() {
  const indexContent = `// This file is auto-generated. Do not edit manually.
// Barrel exports for all generated ABI and address files

${CONTRACTS.map(contract => 
  `export * from './${contract}ABI';\nexport * from './${contract}Addresses';`
).join('\n')}
`;

  const indexFilePath = path.join(ABI_OUTPUT_DIR, 'index.ts');
  fs.writeFileSync(indexFilePath, indexContent);
  console.log(`✅ Generated index file: ${indexFilePath}`);
}

// Main execution
console.log('🔄 Generating ABI and address files...\n');

for (const contract of CONTRACTS) {
  generateABI(contract);
  generateAddresses(contract);
  console.log('');
}

generateIndexFile();

console.log('🎉 ABI generation completed!\n');
console.log('📝 Usage in your components:');
console.log(`import { SecretBallotBoxABI, SecretBallotBoxAddresses } from '@/abi';`);
console.log(`import { getSecretBallotBoxByChainId } from '@/abi';`);
console.log('');
console.log('💡 To regenerate after deployment changes, run: npm run genabi');


