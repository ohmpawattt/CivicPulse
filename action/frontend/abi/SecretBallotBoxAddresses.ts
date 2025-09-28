// This file is auto-generated. Do not edit manually.
// Generated from deployment artifacts

export const SecretBallotBoxAddresses = {
  "31337": {
    "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "chainId": 31337,
    "chainName": "Localhost"
  }
} as const;

export type SecretBallotBoxAddressesType = typeof SecretBallotBoxAddresses;

// Helper function to get contract info by chain ID
export function getSecretBallotBoxByChainId(chainId: number | undefined) {
  if (!chainId) {
    return { abi: [] };
  }
  
  const entry = SecretBallotBoxAddresses[chainId.toString() as keyof typeof SecretBallotBoxAddresses];
  
  if (!entry || !("address" in entry)) {
    return { abi: [], chainId };
  }
  
  return {
    address: entry.address as `0x${string}`,
    chainId: entry.chainId,
    chainName: entry.chainName,
    abi: [], // ABI should be imported separately
  };
}


