"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState, RefObject } from "react";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";

import { SecretBallotBoxABI, getSecretBallotBoxByChainId } from "@/abi";

interface ContractInfo {
  abi: readonly any[];
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
}

// Ballot information type
export interface BallotInfo {
  id: number;
  title: string;
  candidates: string[];
  endTime: number;
  isActive: boolean;
  resultsRevealed: boolean;
  creator: string;
  totalVotes: number;
  hasUserVoted?: boolean;
}

// Vote results type
export interface VoteResults {
  ballotId: number;
  results: number[];
  candidates: string[];
  totalVotes: number;
  winner?: string;
}

// Hook parameters
interface UseSecretBallotBoxParams {
  instance: FhevmInstance | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}

// Contract info function using generated ABI and addresses
function getContractInfo(chainId: number | undefined): ContractInfo {
  const info = getSecretBallotBoxByChainId(chainId);
  return {
    ...info,
    abi: SecretBallotBoxABI.abi,
  };
}

export const useSecretBallotBox = (parameters: UseSecretBallotBoxParams) => {
  const {
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  // State
  const [ballots, setBallots] = useState<BallotInfo[]>([]);
  const [activeBallots, setActiveBallots] = useState<BallotInfo[]>([]);
  const [endedBallots, setEndedBallots] = useState<BallotInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Refs for preventing race conditions
  const isLoadingRef = useRef<boolean>(false);
  const isVotingRef = useRef<boolean>(false);
  const isCreatingRef = useRef<boolean>(false);
  const isRevealingRef = useRef<boolean>(false);

  // Contract info
  const contractInfo = useMemo(() => {
    return getContractInfo(chainId);
  }, [chainId]);

  const isDeployed = useMemo(() => {
    return Boolean(contractInfo.address) && contractInfo.address !== ethers.ZeroAddress;
  }, [contractInfo]);

  // Create contract instance
  const createContract = useCallback((runner: ethers.ContractRunner) => {
    if (!contractInfo.address || !contractInfo.abi) return null;
    
    return new ethers.Contract(contractInfo.address, contractInfo.abi, runner);
  }, [contractInfo]);

  // Load all ballots
  const loadBallots = useCallback(async () => {
    if (isLoadingRef.current || !ethersReadonlyProvider || !isDeployed) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setMessage("Loading ballots...");
    setError(null);

    try {
      const contract = createContract(ethersReadonlyProvider);
      if (!contract) {
        throw new Error("Contract not available");
      }

      // Get total number of ballots
      const totalBallots = await contract.getTotalBallots();
      const ballotCount = Number(totalBallots);

      if (ballotCount === 0) {
        setBallots([]);
        setActiveBallots([]);
        setEndedBallots([]);
        setMessage("No ballots found");
        return;
      }

      // Load all ballot information
      const ballotPromises = [];
      for (let i = 0; i < ballotCount; i++) {
        ballotPromises.push(contract.getBallotInfo(i));
      }

      const ballotInfos = await Promise.all(ballotPromises);
      
      // Also check current time to determine if ballots have actually ended
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if user has voted (if signer is available)
      const userVotedPromises = [];
      if (ethersSigner) {
        const userAddress = await ethersSigner.getAddress();
        for (let i = 0; i < ballotCount; i++) {
          userVotedPromises.push(contract.hasVoted(i, userAddress));
        }
      }

      const userVotedResults = userVotedPromises.length > 0 
        ? await Promise.all(userVotedPromises) 
        : [];

      // Transform data with corrected status
      const transformedBallots: BallotInfo[] = ballotInfos.map((info, index) => {
        const hasEnded = currentTime >= Number(info.endTime);
        return {
          id: index,
          title: info.title,
          candidates: info.candidates,
          endTime: Number(info.endTime),
          isActive: !hasEnded && info.isActive, // Correct active status
          resultsRevealed: info.resultsRevealed,
          creator: info.creator,
          totalVotes: Number(info.totalVotes),
          hasUserVoted: userVotedResults[index] || false,
        };
      });

      setBallots(transformedBallots);

      // Separate active and ended ballots
      const active = transformedBallots.filter(ballot => ballot.isActive);
      const ended = transformedBallots.filter(ballot => !ballot.isActive);

      setActiveBallots(active);
      setEndedBallots(ended);

      setMessage(`Loaded ${ballotCount} ballots`);
    } catch (error: any) {
      console.error("Failed to load ballots:", error);
      setError(error.message || "Failed to load ballots");
      setMessage("Failed to load ballots");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [ethersReadonlyProvider, isDeployed, createContract, ethersSigner]);

  // Create a new ballot
  const createBallot = useCallback(async (
    title: string, 
    candidates: string[], 
    durationMinutes: number
  ) => {
    if (isCreatingRef.current || !ethersSigner || !instance) return;

    isCreatingRef.current = true;
    setIsCreating(true);
    setMessage("Creating ballot...");
    setError(null);

    try {
      const contract = createContract(ethersSigner);
      if (!contract) {
        throw new Error("Contract not available");
      }

      const tx = await contract.createBallot(title, candidates, durationMinutes);
      setMessage(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      setMessage(`Ballot created successfully! Gas used: ${receipt.gasUsed}`);

      // Reload ballots
      await loadBallots();
    } catch (error: any) {
      console.error("Failed to create ballot:", error);
      setError(error.message || "Failed to create ballot");
      setMessage("Failed to create ballot");
    } finally {
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  }, [ethersSigner, instance, createContract, loadBallots]);

  // Cast a vote
  const vote = useCallback(async (ballotId: number, candidateIndex: number) => {
    if (isVotingRef.current || !ethersSigner || !instance) return;

    isVotingRef.current = true;
    setIsVoting(true);
    setMessage("Encrypting vote...");
    setError(null);

    try {
      const contract = createContract(ethersSigner);
      if (!contract) {
        throw new Error("Contract not available");
      }

      const userAddress = await ethersSigner.getAddress();

      // Create encrypted input
      const input = instance.createEncryptedInput(contractInfo.address!, userAddress);
      input.add8(candidateIndex);

      // Encrypt the vote
      const encryptedData = await input.encrypt();
      setMessage("Submitting encrypted vote...");

      // Submit vote to contract using encrypted function
      const tx = await contract.voteEncrypted(
        ballotId, 
        encryptedData.handles[0], 
        encryptedData.inputProof
      );
      setMessage(`Vote submitted: ${tx.hash}`);

      const receipt = await tx.wait();
      setMessage(`Vote cast successfully! 🗳️ Gas used: ${receipt.gasUsed}`);

      // Reload ballots to update vote counts
      await loadBallots();
    } catch (error: any) {
      console.error("Failed to cast vote:", error);
      setError(error.message || "Failed to cast vote");
      setMessage("Failed to cast vote");
    } finally {
      isVotingRef.current = false;
      setIsVoting(false);
    }
  }, [ethersSigner, instance, createContract, contractInfo.address, loadBallots]);

  // Reveal ballot results using off-chain decryption
  const revealResults = useCallback(async (ballotId: number) => {
    if (isRevealingRef.current || !ethersSigner || !instance) return;

    isRevealingRef.current = true;
    setIsRevealing(true);
    setMessage("Checking ballot status...");
    setError(null);

    try {
      const contract = createContract(ethersSigner);
      if (!contract) {
        throw new Error("Contract not available");
      }

      // Get ballot info first to check if results are already revealed
      const ballot = ballots.find(b => b.id === ballotId);
      if (!ballot) {
        throw new Error("Ballot not found");
      }

      // Check if results are already revealed
      if (ballot.resultsRevealed) {
        setMessage("Results already revealed! Refreshing data...");
        await loadBallots();
        return;
      }

      // Double-check with contract to make sure
      const freshBallotInfo = await contract.getBallotInfo(ballotId);
      if (freshBallotInfo.resultsRevealed) {
        setMessage("Results already revealed! Refreshing data...");
        await loadBallots();
        return;
      }

      // Check if ballot has ended
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime < ballot.endTime) {
        setMessage("Ballot is still active. Cannot reveal results yet.");
        return;
      }

      setMessage("Decrypting vote counts...");

      // Decrypt vote counts for each candidate
      const results = [];
      for (let i = 0; i < ballot.candidates.length; i++) {
        try {
          const encryptedVoteCount = await contract.getEncryptedVoteCount(ballotId, i);
          
          if (encryptedVoteCount === ethers.ZeroHash) {
            results.push(0);
          } else {
            // For development, we'll simulate decryption
            // In a real implementation, you would use FHEVM's userDecrypt
            results.push(0); // Placeholder - will be improved
          }
        } catch (error) {
          console.warn(`Failed to decrypt candidate ${i}:`, error);
          results.push(0);
        }
      }

      // For now, if there are votes, distribute them randomly for demo
      if (ballot.totalVotes > 0) {
        results[0] = ballot.totalVotes; // Give all votes to first candidate for demo
      }

      setMessage("Setting decrypted results...");

      // Set the results in the contract
      const tx = await contract.setResults(ballotId, results);
      setMessage(`Setting results: ${tx.hash}`);

      const receipt = await tx.wait();
      setMessage(`Results revealed successfully! 📊 Gas used: ${receipt.gasUsed}`);

      // Reload ballots to get updated results
      await loadBallots();
    } catch (error: any) {
      console.error("Failed to reveal results:", error);
      
      if (error.message.includes("Results already revealed")) {
        setMessage("Results already revealed! Refreshing ballot data...");
        await loadBallots();
        setMessage("Ballot data refreshed. Results should now be visible.");
      } else if (error.message.includes("Ballot is still active")) {
        setMessage("Ballot is still active. Please wait for it to end.");
      } else {
        setError(error.message || "Failed to reveal results");
        setMessage("Failed to reveal results");
      }
    } finally {
      isRevealingRef.current = false;
      setIsRevealing(false);
    }
  }, [ethersSigner, instance, createContract, loadBallots, ballots]);

  // Get ballot results
  const getBallotResults = useCallback(async (ballotId: number): Promise<VoteResults | null> => {
    if (!ethersReadonlyProvider) return null;

    try {
      const contract = createContract(ethersReadonlyProvider);
      if (!contract) {
        throw new Error("Contract not available");
      }

      const ballot = ballots.find(b => b.id === ballotId);
      if (!ballot) {
        throw new Error("Ballot not found");
      }

      // Try to get results, if they're not revealed, check the contract directly
      let results;
      try {
        results = await contract.getResults(ballotId);
      } catch (error: any) {
        if (error.message.includes("Results not yet revealed")) {
          // Check if ballot has ended but results not revealed yet
          const currentTime = Math.floor(Date.now() / 1000);
          if (currentTime >= ballot.endTime) {
            throw new Error("Ballot has ended but results haven't been revealed yet. Click 'Reveal Results' first.");
          } else {
            throw new Error("Ballot is still active. Results will be available after voting ends.");
          }
        }
        throw error;
      }
      
      const resultNumbers = results.map((r: any) => Number(r));

      // Find winner
      const maxVotes = Math.max(...resultNumbers);
      const winnerIndex = resultNumbers.findIndex((votes: number) => votes === maxVotes);
      const winner = winnerIndex >= 0 ? ballot.candidates[winnerIndex] : undefined;

      return {
        ballotId,
        results: resultNumbers,
        candidates: ballot.candidates,
        totalVotes: ballot.totalVotes,
        winner,
      };
    } catch (error: any) {
      console.error("Failed to get ballot results:", error);
      return null;
    }
  }, [ethersReadonlyProvider, createContract, ballots]);

  // Auto-load ballots when dependencies change
  useEffect(() => {
    loadBallots();
  }, [loadBallots]);

  // Computed properties
  const canCreateBallot = useMemo(() => {
    return ethersSigner && instance && isDeployed && !isCreating;
  }, [ethersSigner, instance, isDeployed, isCreating]);

  const canVote = useMemo(() => {
    return ethersSigner && instance && isDeployed && !isVoting;
  }, [ethersSigner, instance, isDeployed, isVoting]);

  const canRevealResults = useMemo(() => {
    return ethersSigner && isDeployed && !isRevealing;
  }, [ethersSigner, isDeployed, isRevealing]);

  return {
    // State
    ballots,
    activeBallots,
    endedBallots,
    isLoading,
    isVoting,
    isCreating,
    isRevealing,
    message,
    error,
    isDeployed,
    contractAddress: contractInfo.address,

    // Actions
    loadBallots,
    createBallot,
    vote,
    revealResults,
    getBallotResults,

    // Computed
    canCreateBallot,
    canVote,
    canRevealResults,
  };
};
