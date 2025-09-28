"use client";

import { ethers } from "ethers";
import { createContext, useContext, useEffect, useRef, useState, ReactNode, RefObject } from "react";

interface MetaMaskContextType {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  connect: () => Promise<void>;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
  initialMockChains: Record<number, string>;
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

interface MetaMaskProviderProps {
  children: ReactNode;
  initialMockChains?: Record<number, string>;
}

export const MetaMaskProvider = ({ children, initialMockChains = { 31337: "http://localhost:8545" } }: MetaMaskProviderProps) => {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[] | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<ethers.ContractRunner | undefined>(undefined);

  const chainIdRef = useRef<number | undefined>(undefined);
  const ethersSignerRef = useRef<ethers.JsonRpcSigner | undefined>(undefined);

  const sameChain = useRef((newChainId: number | undefined) => chainIdRef.current === newChainId);
  const sameSigner = useRef((newSigner: ethers.JsonRpcSigner | undefined) => ethersSignerRef.current === newSigner);

  const isConnected = Boolean(provider && accounts && accounts.length > 0);

  const connect = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const ethereumProvider = window.ethereum as ethers.Eip1193Provider;
        
        // Request account access
        await ethereumProvider.request({ method: "eth_requestAccounts" });
        
        setProvider(ethereumProvider);
        
        // Get accounts
        const accounts = await ethereumProvider.request({ method: "eth_accounts" }) as string[];
        setAccounts(accounts);
        
        // Get chain ID
        const chainId = await ethereumProvider.request({ method: "eth_chainId" }) as string;
        const numericChainId = parseInt(chainId, 16);
        setChainId(numericChainId);
        chainIdRef.current = numericChainId;
        
        // Create ethers provider and signer
        const ethersProvider = new ethers.BrowserProvider(ethereumProvider);
        const signer = await ethersProvider.getSigner();
        setEthersSigner(signer);
        ethersSignerRef.current = signer;
        
        // Create readonly provider
        setEthersReadonlyProvider(ethersProvider);
        
        console.log("Connected to MetaMask:", { accounts, chainId: numericChainId });
      } catch (error) {
        console.error("Failed to connect to MetaMask:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to use this application.");
    }
  };

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        const ethereumProvider = window.ethereum as ethers.Eip1193Provider;
        
        try {
          const accounts = await ethereumProvider.request({ method: "eth_accounts" }) as string[];
          if (accounts.length > 0) {
            setProvider(ethereumProvider);
            setAccounts(accounts);
            
            const chainId = await ethereumProvider.request({ method: "eth_chainId" }) as string;
            const numericChainId = parseInt(chainId, 16);
            setChainId(numericChainId);
            chainIdRef.current = numericChainId;
            
            const ethersProvider = new ethers.BrowserProvider(ethereumProvider);
            const signer = await ethersProvider.getSigner();
            setEthersSigner(signer);
            ethersSignerRef.current = signer;
            
            setEthersReadonlyProvider(ethersProvider);
          }
        } catch (error) {
          console.error("Failed to check MetaMask connection:", error);
        }
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    if (provider) {
      // Listen for account changes
      const handleAccountsChanged = (accounts: string[]) => {
        setAccounts(accounts);
        if (accounts.length === 0) {
          setEthersSigner(undefined);
          setEthersReadonlyProvider(undefined);
          ethersSignerRef.current = undefined;
        }
      };

      // Listen for chain changes
      const handleChainChanged = (chainId: string) => {
        const numericChainId = parseInt(chainId, 16);
        setChainId(numericChainId);
        chainIdRef.current = numericChainId;
        
        // Refresh signer and provider
        if (provider) {
          const ethersProvider = new ethers.BrowserProvider(provider);
          ethersProvider.getSigner().then((signer) => {
            setEthersSigner(signer);
            ethersSignerRef.current = signer;
          });
          setEthersReadonlyProvider(ethersProvider);
        }
      };

      // Type assertion for event handling
      const eventProvider = provider as any;
      eventProvider.on("accountsChanged", handleAccountsChanged);
      eventProvider.on("chainChanged", handleChainChanged);

      return () => {
        eventProvider.removeListener("accountsChanged", handleAccountsChanged);
        eventProvider.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [provider]);

  const value: MetaMaskContextType = {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  };

  return <MetaMaskContext.Provider value={value}>{children}</MetaMaskContext.Provider>;
};

export const useMetaMaskEthersSigner = () => {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error("useMetaMaskEthersSigner must be used within a MetaMaskProvider");
  }
  return context;
};

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}
