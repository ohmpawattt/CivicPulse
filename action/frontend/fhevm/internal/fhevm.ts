import { ethers } from "ethers";
import type { 
  FhevmInstance, 
  FhevmRelayerStatusType,
  FhevmRelayerMetadata 
} from "../fhevmTypes";

export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation was cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

export class FhevmReactError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message);
    this.code = code;
    this.name = "FhevmReactError";
  }
}

// Check if we can fetch FHEVM Hardhat node metadata
async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string): Promise<FhevmRelayerMetadata | null> {
  try {
    console.log(`[FHEVM] Trying to fetch metadata from ${rpcUrl}`);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Try to get client version to check if it's a Hardhat node
    try {
      const clientVersion = await provider.send("web3_clientVersion", []);
      console.log(`[FHEVM] Client version: ${clientVersion}`);
      
      // Check if it's a Hardhat node with FHEVM support
      if (clientVersion.includes("HardhatNetwork")) {
        // For local development, return hardcoded metadata
        // These addresses should match your local FHEVM deployment
        return {
          ACLAddress: "0x50157CFfD6bBFA2DECe204a89ec419c23ef5755D",
          InputVerifierAddress: "0x901F8942346f7AB3a01F6D7613119Bca447Bb030", 
          KMSVerifierAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC"
        };
      }
    } catch (error) {
      console.log(`[FHEVM] Failed to get client version: ${error}`);
    }

    return null;
  } catch (error) {
    console.log(`[FHEVM] Failed to fetch metadata: ${error}`);
    return null;
  }
}

// Resolve provider and chain information
async function resolve(
  providerOrUrl: string | ethers.Eip1193Provider,
  mockChains?: Record<number, string>
): Promise<{ isMock: boolean; rpcUrl: string; chainId: number }> {
  let provider: ethers.JsonRpcProvider | ethers.BrowserProvider;
  
  if (typeof providerOrUrl === "string") {
    provider = new ethers.JsonRpcProvider(providerOrUrl);
  } else {
    provider = new ethers.BrowserProvider(providerOrUrl);
  }

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  
  // Check if this is a mock chain
  const isMock = Boolean(mockChains && chainId in mockChains);
  const rpcUrl = isMock ? mockChains![chainId] : (typeof providerOrUrl === "string" ? providerOrUrl : "");

  return { isMock, rpcUrl, chainId };
}

export const createFhevmInstance = async (parameters: {
  provider: ethers.Eip1193Provider | string;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (status: FhevmRelayerStatusType) => void;
}): Promise<FhevmInstance> => {

  const throwIfAborted = () => {
    if (signal.aborted) throw new FhevmAbortError();
  };

  const { provider: providerOrUrl, mockChains, signal, onStatusChange } = parameters;

  // 1. Resolve chain ID and RPC URL
  const { isMock, rpcUrl, chainId } = await resolve(providerOrUrl, mockChains);

  // 2. Handle Mock environment (development environment)
  if (isMock) {
    console.log(`[FHEVM] Using mock environment for chain ${chainId}`);
    onStatusChange?.("loading");
    
    const fhevmRelayerMetadata = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl);
    if (fhevmRelayerMetadata) {
      //////////////////////////////////////////////////////////////////////////
      // 
      // WARNING!!
      // ALWAYS USE DYNAMIC IMPORT TO AVOID INCLUDING THE ENTIRE FHEVM MOCK LIB 
      // IN THE FINAL PRODUCTION BUNDLE!!
      // 
      //////////////////////////////////////////////////////////////////////////
      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({
        rpcUrl,
        chainId,
        metadata: fhevmRelayerMetadata,
      });
      throwIfAborted();
      onStatusChange?.("ready");
      return mockInstance;
    } else {
      throw new FhevmReactError(
        "FHEVM_RELAYER_METADATA_ERROR",
        "Failed to fetch FHEVM metadata from local node. Make sure your Hardhat node is running with FHEVM support."
      );
    }
  }

  // 3. Production environment handling
  // For production, you would load the Relayer SDK and create a real instance
  // This is left as a placeholder for when you want to deploy to testnet/mainnet
  throw new FhevmReactError(
    "PRODUCTION_NOT_IMPLEMENTED",
    "Production FHEVM instance creation is not implemented yet. Use mock chains for development."
  );
};
