"use client";

import { useState, useCallback } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { SecretBallotBoxABI, getSecretBallotBoxByChainId } from "@/abi";
import { ethers } from "ethers";

export default function DebugPage() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
  } = useMetaMaskEthersSigner();

  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: true,
  });

  const contractInfo = getSecretBallotBoxByChainId(chainId);

  const testCreateBallot = useCallback(async () => {
    if (!ethersSigner || !contractInfo.address) {
      setMessage("No signer or contract address");
      return;
    }

    setIsLoading(true);
    setMessage("Creating test ballot...");

    try {
      console.log("Contract address:", contractInfo.address);
      console.log("Chain ID:", chainId);
      console.log("Signer:", await ethersSigner.getAddress());

      const contract = new ethers.Contract(
        contractInfo.address,
        SecretBallotBoxABI.abi,
        ethersSigner
      );

      console.log("Contract instance created:", contract);

      const title = "Debug Test Election";
      const candidates = ["Alice", "Bob"];
      const duration = 60; // 1 hour

      console.log("Calling createBallot with:", { title, candidates, duration });

      const tx = await contract.createBallot(title, candidates, duration);
      console.log("Transaction sent:", tx.hash);
      setMessage(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      setMessage(`Ballot created! Gas used: ${receipt.gasUsed}`);

    } catch (error: any) {
      console.error("Error creating ballot:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [ethersSigner, contractInfo.address, chainId]);

  const testVote = useCallback(async () => {
    if (!ethersSigner || !contractInfo.address) {
      setMessage("No signer or contract address");
      return;
    }

    setIsLoading(true);
    setMessage("Casting test vote...");

    try {
      const contract = new ethers.Contract(
        contractInfo.address,
        SecretBallotBoxABI.abi,
        ethersSigner
      );

      console.log("Voting for candidate 0 on ballot 0");

      const tx = await contract.vote(0, 0); // Simple vote, not encrypted
      console.log("Vote transaction sent:", tx.hash);
      setMessage(`Vote sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log("Vote confirmed:", receipt);
      setMessage(`Vote cast! Gas used: ${receipt.gasUsed}`);

    } catch (error: any) {
      console.error("Error voting:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [ethersSigner, contractInfo.address]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">SecretBallotBox Debug Page</h1>

      {/* Connection Status */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        <div className="space-y-2 text-sm">
          <p>Connected: {isConnected ? "✅ Yes" : "❌ No"}</p>
          <p>Chain ID: {chainId || "None"}</p>
          <p>Account: {accounts?.[0] || "None"}</p>
          <p>Contract Address: {contractInfo.address || "Not found"}</p>
          <p>FHEVM Status: {fhevmStatus}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="space-y-4">
          {!isConnected ? (
            <button
              onClick={connect}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Connect MetaMask
            </button>
          ) : (
            <div className="space-x-4">
              <button
                onClick={testCreateBallot}
                disabled={isLoading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Create Test Ballot"}
              </button>
              
              <button
                onClick={testVote}
                disabled={isLoading}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {isLoading ? "Voting..." : "Cast Test Vote"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Status:</h3>
        <p className="text-sm font-mono">{message || "Ready"}</p>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 p-4 rounded-lg mt-6">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify({
            chainId,
            contractAddress: contractInfo.address,
            fhevmStatus,
            isConnected,
            accounts,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}


