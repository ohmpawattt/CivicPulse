"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useSecretBallotBox } from "@/hooks/useSecretBallotBox";
import { BallotResultsCard } from "@/components/BallotResultsCard";

export default function ResultsPage() {
  const [selectedBallotId, setSelectedBallotId] = useState<number | null>(null);

  // MetaMask integration
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = useMetaMaskEthersSigner();

  // FHEVM instance
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
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

  // Filter ballots that have results revealed
  const ballotsWithResults = ballotBox.ballots.filter(ballot => ballot.resultsRevealed);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect to View Results</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view voting results and statistics.
          </p>
          <button onClick={connect} className="btn-primary">
            Connect MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold gradient-text">Voting Results</h1>
          <p className="text-gray-600">
            View decrypted results from completed elections
          </p>
        </div>

        <button
          onClick={ballotBox.loadBallots}
          disabled={ballotBox.isLoading}
          className="btn-outline flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${ballotBox.isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status */}
      {ballotBox.message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">{ballotBox.message}</p>
        </div>
      )}

      {ballotBox.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{ballotBox.error}</p>
        </div>
      )}

      {/* Results Grid */}
      {ballotsWithResults.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ballotsWithResults.map((ballot) => (
            <BallotResultsCard
              key={ballot.id}
              ballotId={ballot.id}
              title={ballot.title}
              candidates={ballot.candidates}
              totalVotes={ballot.totalVotes}
              onGetResults={ballotBox.getBallotResults}
              autoRefresh={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Results Available
          </h3>
          <p className="text-gray-600 mb-6">
            No ballots have had their results revealed yet. 
            Results will appear here once voting ends and results are decrypted.
          </p>
          <a href="/" className="btn-primary">
            Back to Voting Dashboard
          </a>
        </div>
      )}

      {/* Quick Stats */}
      {ballotsWithResults.length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Overall Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {ballotsWithResults.length}
              </div>
              <div className="text-sm text-gray-600">Completed Elections</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {ballotsWithResults.reduce((sum, ballot) => sum + ballot.totalVotes, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Votes Cast</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {ballotsWithResults.reduce((sum, ballot) => sum + ballot.candidates.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Candidates</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(ballotsWithResults.reduce((sum, ballot) => 
                  sum + (ballot.totalVotes / ballot.candidates.length), 0
                ))}
              </div>
              <div className="text-sm text-gray-600">Avg Votes/Candidate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


