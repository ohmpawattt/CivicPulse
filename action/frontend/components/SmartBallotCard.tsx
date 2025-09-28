"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Users, CheckCircle, Lock, Unlock, Trophy, BarChart3 } from "lucide-react";
import type { BallotInfo, VoteResults } from "@/hooks/useSecretBallotBox";

interface SmartBallotCardProps {
  ballot: BallotInfo;
  onVote?: (ballotId: number) => void;
  onRevealResults?: (ballotId: number) => void;
  onGetResults?: (ballotId: number) => Promise<VoteResults | null>;
  canVote?: boolean;
  canReveal?: boolean;
}

export function SmartBallotCard({ 
  ballot, 
  onVote, 
  onRevealResults, 
  onGetResults,
  canVote = false, 
  canReveal = false 
}: SmartBallotCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState<VoteResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  const endDate = new Date(ballot.endTime * 1000);
  const isActive = ballot.isActive && Date.now() < ballot.endTime * 1000;
  const timeRemaining = isActive ? endDate.getTime() - Date.now() : 0;
  
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Ended";
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  // Load results if ballot has results revealed
  useEffect(() => {
    if (ballot.resultsRevealed && onGetResults && !results && !isLoadingResults) {
      setIsLoadingResults(true);
      onGetResults(ballot.id)
        .then(setResults)
        .catch(console.error)
        .finally(() => setIsLoadingResults(false));
    }
  }, [ballot.resultsRevealed, ballot.id, onGetResults, results, isLoadingResults]);

  const getStatusBadge = () => {
    if (isActive) {
      return <span className="badge badge-success status-active pl-3">🟢 Active</span>;
    } else if (ballot.resultsRevealed) {
      return <span className="badge badge-info status-ended pl-3">🔓 Results Available</span>;
    } else {
      return <span className="badge badge-warning status-ended pl-3">🔒 Ended (Pending Reveal)</span>;
    }
  };

  const handleRevealOrView = () => {
    if (ballot.resultsRevealed) {
      // If results are already revealed, load and show them
      if (onGetResults) {
        setIsLoadingResults(true);
        onGetResults(ballot.id)
          .then(setResults)
          .catch(console.error)
          .finally(() => setIsLoadingResults(false));
      }
    } else {
      // If results are not revealed, reveal them
      onRevealResults?.(ballot.id);
    }
  };

  return (
    <div className="card animate-fade-in hover:scale-105 transition-all duration-300">
      <div className="card-header">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="card-title text-lg font-bold text-gray-900 mb-2">
              {ballot.title}
            </h3>
            <p className="card-description text-gray-600">
              Created by {ballot.creator.slice(0, 6)}...{ballot.creator.slice(-4)}
            </p>
          </div>
          <div className="ml-4">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{ballot.totalVotes} votes</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              {isActive ? formatTimeRemaining(timeRemaining) : "Ended"}
            </span>
          </div>
        </div>

        {/* End time */}
        <div className="text-sm text-gray-500">
          Ends: {endDate.toLocaleString()}
        </div>

        {/* Candidates preview */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Candidates:</h4>
          <div className="flex flex-wrap gap-2">
            {ballot.candidates.slice(0, 3).map((candidate, index) => (
              <span key={index} className="badge bg-gray-100 text-gray-700">
                {candidate}
              </span>
            ))}
            {ballot.candidates.length > 3 && (
              <span className="badge bg-gray-100 text-gray-500">
                +{ballot.candidates.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Results display for revealed ballots */}
        {ballot.resultsRevealed && results && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-3">
              <Trophy className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Final Results</h4>
            </div>
            
            <div className="space-y-2">
              {results.candidates.map((candidate, index) => {
                const votes = results.results[index];
                const percentage = results.totalVotes > 0 ? (votes / results.totalVotes) * 100 : 0;
                const isWinner = votes === Math.max(...results.results) && votes > 0;
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isWinner && <Trophy className="h-3 w-3 text-yellow-500" />}
                      <span className={`text-sm ${isWinner ? 'font-semibold text-green-800' : 'text-gray-700'}`}>
                        {candidate}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {votes} votes ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
            
            {results.winner && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="text-center text-sm font-semibold text-green-800">
                  🎉 Winner: {results.winner}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voting status */}
        {ballot.hasUserVoted && (
          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span>You have voted in this ballot</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          {isActive && !ballot.hasUserVoted && canVote && (
            <button
              onClick={() => onVote?.(ballot.id)}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              <Lock className="h-4 w-4" />
              <span>Cast Encrypted Vote</span>
            </button>
          )}

          {!isActive && (ballot.resultsRevealed ? (
            <Link
              href={{ pathname: "/ballot", query: { id: ballot.id } }}
              className="btn-secondary flex-1 flex items-center justify-center space-x-2 no-underline"
            >
              <BarChart3 className="h-4 w-4" />
              <span>View Detailed Results</span>
            </Link>
          ) : canReveal ? (
            <button
              onClick={handleRevealOrView}
              className="btn-secondary flex-1 flex items-center justify-center space-x-2"
            >
              <Unlock className="h-4 w-4" />
              <span>Reveal Results</span>
            </button>
          ) : (
            <div className="flex-1 text-center p-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              Waiting for results to be revealed
            </div>
          ))}

          {isActive && ballot.hasUserVoted && (
            <div className="flex-1 text-center p-2 bg-green-50 text-green-700 rounded-lg text-sm">
              Vote cast successfully 🗳️
            </div>
          )}
        </div>

        {/* Expand/Collapse for full candidate list */}
        {ballot.candidates.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            {isExpanded ? "Show less" : "Show all candidates"}
          </button>
        )}

        {/* Expanded candidate list */}
        {isExpanded && (
          <div className="space-y-2 animate-slide-up">
            <h4 className="font-medium text-gray-900">All Candidates:</h4>
            <div className="grid grid-cols-2 gap-2">
              {ballot.candidates.map((candidate, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="font-medium text-gray-700">{index + 1}.</span>{" "}
                  {candidate}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
