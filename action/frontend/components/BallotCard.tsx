"use client";

import { useState } from "react";
import { Clock, Users, CheckCircle, Lock, Unlock } from "lucide-react";
import type { BallotInfo } from "@/hooks/useSecretBallotBox";

interface BallotCardProps {
  ballot: BallotInfo;
  onVote?: (ballotId: number) => void;
  onViewResults?: (ballotId: number) => void;
  onRevealResults?: (ballotId: number) => void;
  canVote?: boolean;
  canReveal?: boolean;
}

export function BallotCard({ ballot, onVote, onViewResults, onRevealResults, canVote = false, canReveal = false }: BallotCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const getStatusBadge = () => {
    if (isActive) {
      return <span className="badge badge-success status-active pl-3">🟢 Active</span>;
    } else if (ballot.resultsRevealed) {
      return <span className="badge badge-info status-ended pl-3">🔓 Results Available</span>;
    } else {
      return <span className="badge badge-warning status-ended pl-3">🔒 Ended (Pending Reveal)</span>;
    }
  };

  const getWinnerInfo = () => {
    // This would need to be passed as a prop or fetched
    // For now, just show that results are available
    if (ballot.resultsRevealed && ballot.totalVotes > 0) {
      return (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800 text-center">
            🏆 Results revealed! {ballot.totalVotes} votes cast
          </div>
        </div>
      );
    }
    return null;
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

          {!isActive && ballot.resultsRevealed && (
            <button
              onClick={() => onViewResults?.(ballot.id)}
              className="btn-secondary flex-1 flex items-center justify-center space-x-2"
            >
              <Unlock className="h-4 w-4" />
              <span>View Results</span>
            </button>
          )}

          {!isActive && !ballot.resultsRevealed && canReveal && (
            <button
              onClick={() => onRevealResults?.(ballot.id)}
              className="btn-secondary flex-1 flex items-center justify-center space-x-2"
            >
              <Unlock className="h-4 w-4" />
              <span>Reveal Results</span>
            </button>
          )}

          {!isActive && !ballot.resultsRevealed && !canReveal && (
            <div className="flex-1 text-center p-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              Waiting for results to be revealed
            </div>
          )}

          {isActive && ballot.hasUserVoted && (
            <div className="flex-1 text-center p-2 bg-green-50 text-green-700 rounded-lg text-sm">
              Vote cast successfully 🗳️
            </div>
          )}
        </div>

        {/* Winner info for revealed results */}
        {getWinnerInfo()}

        {/* Expand/Collapse for full candidate list */}
        {ballot.candidates.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
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
