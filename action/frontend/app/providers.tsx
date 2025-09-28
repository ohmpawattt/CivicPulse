"use client";

import { ReactNode } from "react";
import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MetaMaskProvider 
      initialMockChains={{ 31337: "http://localhost:8545" }}
    >
      {children}
    </MetaMaskProvider>
  );
}


