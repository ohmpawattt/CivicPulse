"use client";

import { useState, useCallback } from "react";
import { Plus, Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useSecretBallotBox } from "@/hooks/useSecretBallotBox";
import { SmartBallotCard } from "@/components/SmartBallotCard";
import { VotingModal } from "@/components/VotingModal";
import { ResultsModal } from "@/components/ResultsModal";
import { CreateBallotModal } from "@/components/CreateBallotModal";
import type { BallotInfo, VoteResults } from "@/hooks/useSecretBallotBox";

export default function HomePage() {
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [selectedBallot, setSelectedBallot] = useState<BallotInfo | null>(null);
  const [selectedResults, setSelectedResults] = useState<VoteResults | null>(null);

  // MetaMask integration
  const {
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
  } = useMetaMaskEthersSigner();

  // FHEVM instance
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  // SecretBallotBox contract integration
  const ballotBox = useSecretBallotBox({
    instance: fhevmInstance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // Handle voting
  const handleVote = useCallback((ballotId: number) => {
    const ballot = ballotBox.ballots.find(b => b.id === ballotId);
    if (ballot) {
      setSelectedBallot(ballot);
      setIsVotingModalOpen(true);
    }
  }, [ballotBox.ballots]);

  // Handle vote submission
  const handleSubmitVote = useCallback(async (ballotId: number, candidateIndex: number) => {
    await ballotBox.vote(ballotId, candidateIndex);
    setIsVotingModalOpen(false);
    setSelectedBallot(null);
  }, [ballotBox]);

  // Handle viewing results
  const handleViewResults = useCallback(async (ballotId: number) => {
    const results = await ballotBox.getBallotResults(ballotId);
    if (results) {
      setSelectedResults(results);
      setIsResultsModalOpen(true);
    }
  }, [ballotBox]);

  // Handle creating ballot
  const handleCreateBallot = useCallback(async (title: string, candidates: string[], durationMinutes: number) => {
    await ballotBox.createBallot(title, candidates, durationMinutes);
    setIsCreateModalOpen(false);
  }, [ballotBox]);

  // Handle revealing results
  const handleRevealResults = useCallback(async (ballotId: number) => {
    await ballotBox.revealResults(ballotId);
  }, [ballotBox]);

  // Connection status component
  const ConnectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 mb-6">
              Connect your MetaMask wallet to start voting in secure, private elections.
            </p>
            <button onClick={connect} className="btn-primary">
              <Wallet className="h-5 w-5 mr-2" />
              Connect MetaMask
            </button>
          </div>
        </div>
      );
    }

    if (!ballotBox.isDeployed) {
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Contract Not Deployed
            </h3>
            <p className="text-gray-600 mb-4">
              The SecretBallotBox contract is not deployed on this network (Chain ID: {chainId}).
            </p>
            <p className="text-sm text-gray-500">
              Please make sure you're connected to the correct network and the contract is deployed.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  // FHEVM status component
  const FHEVMStatus = () => {
    if (fhevmStatus === "loading") {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="spinner" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold">Initializing FHEVM...</p>
              <p>Setting up encrypted computation environment.</p>
            </div>
          </div>
        </div>
      );
    }

    if (fhevmStatus === "error") {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="text-sm text-red-800">
              <p className="font-semibold">FHEVM Error</p>
              <p>{fhevmError?.message || "Failed to initialize FHEVM"}</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
          SecretBallotBox
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Vote with complete privacy and transparency. Our FHEVM-powered platform ensures 
          your votes remain encrypted and anonymous while maintaining full auditability.
        </p>
        
        {/* Status indicators */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium">
              {isConnected ? `Connected (${accounts?.[0]?.slice(0, 6)}...${accounts?.[0]?.slice(-4)})` : 'Not Connected'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <div className={`h-2 w-2 rounded-full ${
              fhevmStatus === 'ready' ? 'bg-green-500' : 
              fhevmStatus === 'loading' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              FHEVM {fhevmStatus === 'ready' ? 'Ready' : fhevmStatus === 'loading' ? 'Loading' : 'Error'}
            </span>
          </div>

          {chainId && (
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm font-medium">
                Chain {chainId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* FHEVM Status */}
      <FHEVMStatus />

      {/* Connection Status */}
      <ConnectionStatus />

      {/* Main Content */}
      {isConnected && ballotBox.isDeployed && (
        <>
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Voting Dashboard</h2>
              <p className="text-gray-600">
                {ballotBox.message || "Manage and participate in secure elections"}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={ballotBox.loadBallots}
                disabled={ballotBox.isLoading}
                className="btn-outline flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${ballotBox.isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!ballotBox.canCreateBallot}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Ballot</span>
              </button>
            </div>
          </div>

          {/* Error Display */}
          {ballotBox.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold">Error</p>
                  <p>{ballotBox.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Active Ballots */}
          {ballotBox.activeBallots.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Active Ballots ({ballotBox.activeBallots.length})
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ballotBox.activeBallots.map((ballot) => (
                  <SmartBallotCard
                    key={ballot.id}
                    ballot={ballot}
                    onVote={handleVote}
                    onGetResults={ballotBox.getBallotResults}
                    canVote={ballotBox.canVote}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Ended Ballots */}
          {ballotBox.endedBallots.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-3 w-3 rounded-full bg-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Ended Ballots ({ballotBox.endedBallots.length})
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ballotBox.endedBallots.map((ballot) => (
                  <SmartBallotCard
                    key={ballot.id}
                    ballot={ballot}
                    onRevealResults={handleRevealResults}
                    onGetResults={ballotBox.getBallotResults}
                    canVote={false}
                    canReveal={ballotBox.canRevealResults}
                  />
                ))}
              </div>
            </section>
          )}

          {/* No Ballots */}
          {ballotBox.ballots.length === 0 && !ballotBox.isLoading && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🗳️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Ballots Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Be the first to create a secure, private voting ballot.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  disabled={!ballotBox.canCreateBallot}
                  className="btn-primary"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Ballot
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {ballotBox.isLoading && (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4" style={{ width: '2rem', height: '2rem' }} />
              <p className="text-gray-600">Loading ballots...</p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateBallotModal
        isOpen={isCreateModalOpen}
        isCreating={ballotBox.isCreating}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateBallot}
      />

      <VotingModal
        ballot={selectedBallot}
        isOpen={isVotingModalOpen}
        isVoting={ballotBox.isVoting}
        onClose={() => {
          setIsVotingModalOpen(false);
          setSelectedBallot(null);
        }}
        onVote={handleSubmitVote}
      />

      <ResultsModal
        results={selectedResults}
        isOpen={isResultsModalOpen}
        onClose={() => {
          setIsResultsModalOpen(false);
          setSelectedResults(null);
        }}
      />
    </div>
  );
}
