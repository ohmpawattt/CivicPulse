"use client";

import { useState, useEffect } from "react";
import { Trophy, Users, BarChart3, RefreshCw } from "lucide-react";
import type { VoteResults } from "@/hooks/useSecretBallotBox";

interface BallotResultsCardProps {
  ballotId: number;
  title: string;
  candidates: string[];
  totalVotes: number;
  onGetResults: (ballotId: number) => Promise<VoteResults | null>;
  autoRefresh?: boolean;
}

export function BallotResultsCard({ 
  ballotId, 
  title, 
  candidates, 
  totalVotes, 
  onGetResults, 
  autoRefresh = true 
}: BallotResultsCardProps) {
  const [results, setResults] = useState<VoteResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResults = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const ballotResults = await onGetResults(ballotId);
      setResults(ballotResults);
    } catch (err: any) {
      setError(err.message || "Failed to load results");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [ballotId]);

  // Auto refresh every 10 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(loadResults, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (isLoading && !results) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="spinner mr-3" />
          <span>Loading results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">❌ Error loading results</div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button onClick={loadResults} className="btn-outline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="card border-yellow-200">
        <div className="text-center py-8">
          <div className="text-yellow-600 mb-2">⏳ Results not available</div>
          <p className="text-sm text-gray-600">Results haven't been revealed yet</p>
        </div>
      </div>
    );
  }

  const maxVotes = Math.max(...results.results);
  const winners = results.candidates.filter((_, index) => results.results[index] === maxVotes);

  return (
    <div className="card border-green-200">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-title">{title}</h3>
            <p className="card-description">Ballot #{ballotId} • Final Results</p>
          </div>
          <button
            onClick={loadResults}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Refresh results"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-blue-900">{results.totalVotes}</div>
          <div className="text-xs text-blue-700">Total Votes</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <Trophy className="h-5 w-5 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-900">{maxVotes}</div>
          <div className="text-xs text-green-700">Top Votes</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <BarChart3 className="h-5 w-5 text-purple-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-purple-900">{results.candidates.length}</div>
          <div className="text-xs text-purple-700">Candidates</div>
        </div>
      </div>

      {/* Winner Announcement */}
      {results.totalVotes > 0 && (
        <div className="mb-4">
          {winners.length === 1 ? (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg text-center">
              <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <div className="font-bold text-yellow-900">🎉 Winner: {winners[0]}</div>
              <div className="text-sm text-yellow-800">
                {maxVotes} votes ({((maxVotes / results.totalVotes) * 100).toFixed(1)}%)
              </div>
            </div>
          ) : winners.length > 1 ? (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-center">
              <Trophy className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="font-bold text-blue-900">🤝 Tie: {winners.join(" & ")}</div>
              <div className="text-sm text-blue-800">{maxVotes} votes each</div>
            </div>
          ) : null}
        </div>
      )}

      {/* Results Breakdown */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm">Vote Breakdown:</h4>
        {results.candidates.map((candidate, index) => {
          const votes = results.results[index];
          const percentage = results.totalVotes > 0 ? (votes / results.totalVotes) * 100 : 0;
          const isWinner = votes === maxVotes && maxVotes > 0;
          
          return (
            <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
              isWinner ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-2">
                {isWinner && <Trophy className="h-4 w-4 text-yellow-600" />}
                <span className={`font-medium ${isWinner ? 'text-yellow-900' : 'text-gray-900'}`}>
                  {candidate}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Vote bar */}
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isWinner ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="text-right min-w-[60px]">
                  <div className={`font-mono text-sm ${isWinner ? 'text-yellow-900' : 'text-gray-900'}`}>
                    {votes} votes
                  </div>
                  <div className={`text-xs ${isWinner ? 'text-yellow-700' : 'text-gray-500'}`}>
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No votes message */}
      {results.totalVotes === 0 && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>No votes were cast in this ballot</p>
        </div>
      )}
    </div>
  );
}


