import type { ethers } from "ethers";

// FHEVM Instance type (compatible with MockFhevmInstance)
export interface FhevmInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInputBuffer;
  userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<Record<string, bigint>>;
  generateKeypair(): { publicKey: string; privateKey: string };
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): EIP712Type;
  getPublicKey(): FhevmStoredPublicKey | null;
  getPublicParams(size: number): FhevmStoredPublicParams | null;
}

// Encrypted Input Buffer
export interface EncryptedInputBuffer {
  add8(value: number): EncryptedInputBuffer;
  add16(value: number): EncryptedInputBuffer;
  add32(value: number): EncryptedInputBuffer;
  add64(value: bigint): EncryptedInputBuffer;
  add128(value: bigint): EncryptedInputBuffer;
  add256(value: bigint): EncryptedInputBuffer;
  addBool(value: boolean): EncryptedInputBuffer;
  addAddress(value: string): EncryptedInputBuffer;
  encrypt(): Promise<EncryptedData>;
}

// Encrypted Data Result
export interface EncryptedData {
  handles: string[] | Uint8Array[];
  inputProof: string | Uint8Array;
}

// EIP712 Type Definition
export interface EIP712Type {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: {
    UserDecryptRequestVerification: Array<{
      name: string;
      type: string;
    }>;
  };
  message: {
    publicKey: string;
    contractAddresses: string[];
    startTimestamp: number;
    durationDays: number;
  };
}

// Storage Types
export interface FhevmStoredPublicKey {
  publicKeyId: string;
  publicKey: string;
}

export interface FhevmStoredPublicParams {
  [key: string]: string;
}

// Instance Configuration
export interface FhevmInstanceConfig {
  aclContractAddress: string;
  chainId: number;
  gatewayChainId: number;
  inputVerifierContractAddress: string;
  kmsContractAddress: string;
  network: string | ethers.Eip1193Provider;
  publicKey?: {
    id: string;
    data: string;
  };
  publicParams?: {
    "2048": FhevmStoredPublicParams;
  } | null;
}

// Relayer Status
export type FhevmRelayerStatusType = "loading" | "ready" | "error";

// Hook Status
export type FhevmGoState = "idle" | "loading" | "ready" | "error";

// Mock Chain Metadata
export interface FhevmRelayerMetadata {
  ACLAddress: `0x${string}`;
  InputVerifierAddress: `0x${string}`;
  KMSVerifierAddress: `0x${string}`;
}
