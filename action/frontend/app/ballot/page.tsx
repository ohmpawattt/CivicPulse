"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Trophy, Users, BarChart3, Clock, Shield, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useSecretBallotBox } from "@/hooks/useSecretBallotBox";
import type { BallotInfo, VoteResults } from "@/hooks/useSecretBallotBox";

function BallotResultsContent() {
  const search = useSearchParams();
  const idParam = search.get("id");
  const ballotId = idParam ? parseInt(idParam) : NaN;
  
  const [ballot, setBallot] = useState<BallotInfo | null>(null);
  const [results, setResults] = useState<VoteResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Load ballot and results data
  useEffect(() => {
    const loadData = async () => {
      if (!ballotBox.ballots || ballotBox.isLoading || Number.isNaN(ballotId)) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const foundBallot = ballotBox.ballots.find(b => b.id === ballotId);
        if (!foundBallot) {
          setError(`Ballot #${ballotId} not found`);
          return;
        }

        setBallot(foundBallot);

        if (foundBallot.resultsRevealed) {
          const ballotResults = await ballotBox.getBallotResults(ballotId);
          setResults(ballotResults);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load ballot data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [ballotId, ballotBox.ballots, ballotBox.isLoading]);

  const handleRevealResults = async () => {
    if (!ballot || ballot.resultsRevealed) return;
    await ballotBox.revealResults(ballotId);
    setTimeout(async () => {
      const ballotResults = await ballotBox.getBallotResults(ballotId);
      setResults(ballotResults);
    }, 2000);
  };

  const refreshData = () => {
    ballotBox.loadBallots();
  };

  // Prepare chart data
  const chartData = results ? results.candidates.map((candidate, index) => ({
    name: candidate,
    votes: results.results[index],
    percentage: results.totalVotes > 0 ? ((results.results[index] / results.totalVotes) * 100).toFixed(1) : "0.0"
  })) : [];

  const pieData = chartData.filter(item => item.votes > 0);

  // Colors for charts
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet Required</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view ballot results.
          </p>
          <button onClick={connect} className="btn-primary">
            Connect MetaMask
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="spinner mx-auto mb-4" style={{ width: '2rem', height: '2rem' }} />
          <p className="text-gray-600">Loading ballot results...</p>
        </div>
      </div>
    );
  }

  if (error || !ballot) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Ballot</h2>
          <p className="text-gray-600 mb-6">{error || "Ballot not found"}</p>
          <Link href="/" className="btn-primary no-underline">
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  const endDate = new Date(ballot.endTime * 1000);
  const hasEnded = Date.now() > ballot.endTime * 1000;
  const maxVotes = results ? Math.max(...results.results) : 0;

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link
          href="/"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors no-underline"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{ballot.title}</h1>
            <span className="badge badge-info">Ballot #{ballotId}</span>
          </div>
          <p className="text-gray-600">
            Created by {ballot.creator.slice(0, 6)}...{ballot.creator.slice(-4)} • 
            Ended {endDate.toLocaleString()}
          </p>
        </div>

        <button
          onClick={refreshData}
          disabled={ballotBox.isLoading}
          className="btn-outline flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${ballotBox.isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Status Messages */}
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Ballot Info Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Ballot Overview
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-xl font-bold text-blue-900">{ballot.totalVotes}</div>
                  <div className="text-sm text-blue-700">Total Votes</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Trophy className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <div className="text-xl font-bold text-green-900">{ballot.candidates.length}</div>
                  <div className="text-sm text-green-700">Candidates</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${hasEnded ? 'text-red-600' : 'text-green-600'}`}>
                    {hasEnded ? '🔒 Ended' : '🟢 Active'}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Results:</span>
                  <span className={`font-medium ${ballot.resultsRevealed ? 'text-green-600' : 'text-yellow-600'}`}>
                    {ballot.resultsRevealed ? '🔓 Revealed' : '🔒 Pending'}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">End Time:</span>
                  <span className="font-mono text-gray-900">
                    {endDate.toLocaleDateString()} {endDate.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Candidates List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Candidates</h3>
            </div>
            
            <div className="space-y-2">
              {ballot.candidates.map((candidate, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{candidate}</span>
                  </div>
                  
                  {results && (
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{results.results[index]} votes</div>
                      <div className="text-xs text-gray-500">
                        {results.totalVotes > 0 ? ((results.results[index] / results.totalVotes) * 100).toFixed(1) : "0.0"}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          {hasEnded && !ballot.resultsRevealed && (
            <button
              onClick={handleRevealResults}
              disabled={ballotBox.isRevealing}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {ballotBox.isRevealing ? (
                <>
                  <div className="spinner" />
                  <span>Revealing Results...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Decrypt & Reveal Results</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Column - Results Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {ballot.resultsRevealed && results ? (
            <>
              {/* Winner Announcement */}
              {results.totalVotes > 0 && (
                <div className="card border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="text-center py-8">
                    <Trophy className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                    {results.winner ? (
                      <>
                        <h2 className="text-3xl font-bold text-yellow-900 mb-2">
                          🎉 Winner: {results.winner}
                        </h2>
                        <p className="text-yellow-800 text-lg">
                          {maxVotes} votes ({((maxVotes / results.totalVotes) * 100).toFixed(1)}% of total)
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-3xl font-bold text-blue-900 mb-2">
                          🤝 It's a Tie!
                        </h2>
                        <p className="text-blue-800 text-lg">
                          Multiple candidates tied with {maxVotes} votes each
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Vote Distribution</h3>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [`${value} votes`, "Votes"]}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colors[index % colors.length]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart */}
                {pieData.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Vote Share</h3>
                    </div>
                    
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="votes"
                          >
                            {pieData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={colors[index % colors.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [`${value} votes`, "Votes"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Results Table */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Detailed Results</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Votes
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {chartData
                        .sort((a, b) => b.votes - a.votes)
                        .map((candidate, index) => {
                          const isWinner = candidate.votes === maxVotes && maxVotes > 0;
                          return (
                            <tr key={candidate.name} className={isWinner ? "bg-yellow-50" : ""}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`text-sm font-medium ${isWinner ? "text-yellow-900" : "text-gray-900"}`}>
                                    #{index + 1}
                                  </span>
                                  {isWinner && <Trophy className="h-4 w-4 text-yellow-600 ml-2" />}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${isWinner ? "text-yellow-900" : "text-gray-900"}`}>
                                  {candidate.name}
                                  {isWinner && <span className="ml-2 badge badge-warning">WINNER</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className={`text-sm font-mono ${isWinner ? "text-yellow-900" : "text-gray-900"}`}>
                                  {candidate.votes}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className={`text-sm font-mono ${isWinner ? "text-yellow-900" : "text-gray-600"}`}>
                                  {candidate.percentage}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {isWinner ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    🏆 Winner
                                  </span>
                                ) : candidate.votes > 0 ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Participant
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    No Votes
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statistics Summary */}
              <div className="card bg-gradient-to-r from-blue-50 to-green-50">
                <div className="card-header">
                  <h3 className="card-title">📊 Election Statistics</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-blue-600">{results.totalVotes}</div>
                    <div className="text-sm text-gray-600">Total Votes</div>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-green-600">{maxVotes}</div>
                    <div className="text-sm text-gray-600">Highest Score</div>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {results.totalVotes > 0 ? ((maxVotes / results.totalVotes) * 100).toFixed(1) : "0"}%
                    </div>
                    <div className="text-sm text-gray-600">Win Margin</div>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {chartData.filter(c => c.votes > 0).length}
                    </div>
                    <div className="text-sm text-gray-600">Active Candidates</div>
                  </div>
                </div>
              </div>

            </>
          ) : (
            /* Results Not Revealed */
            <div className="lg:col-span-2">
              <div className="card text-center py-12">
                {hasEnded ? (
                  <>
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Results Pending Decryption
                    </h2>
                    <p className="text-gray-600 mb-6">
                      This ballot has ended with {ballot.totalVotes} votes cast. 
                      Results need to be decrypted and revealed.
                    </p>
                    {ballotBox.canRevealResults && (
                      <button
                        onClick={handleRevealResults}
                        disabled={ballotBox.isRevealing}
                        className="btn-primary flex items-center space-x-2 mx-auto"
                      >
                        {ballotBox.isRevealing ? (
                          <>
                            <div className="spinner" />
                            <span>Decrypting Results...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            <span>Decrypt & Reveal Results</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">🗳️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Voting in Progress
                    </h2>
                    <p className="text-gray-600 mb-6">
                      This ballot is still active. Results will be available after voting ends.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Ends: {endDate.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="lg:col-span-3 mt-8">
          <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="flex items-start space-x-4">
              <Shield className="h-8 w-8 text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold text-green-900 mb-2">🔒 Privacy Protection</h4>
                <p className="text-green-800 text-sm leading-relaxed">
                  This election used FHEVM (Fully Homomorphic Encryption Virtual Machine) technology 
                  to ensure complete voter privacy. Individual votes were encrypted throughout the entire 
                  voting process and only the final aggregated results are revealed. No one can trace 
                  individual voting choices back to specific voters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BallotResultsPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-8"><div className="spinner mx-auto mb-4" style={{ width: '2rem', height: '2rem' }} /><p className="text-gray-600 text-center">Loading...</p></div>}>
      <BallotResultsContent />
    </Suspense>
  );
}


