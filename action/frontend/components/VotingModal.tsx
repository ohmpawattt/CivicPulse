"use client";

import { useState, useEffect } from "react";
import { X, Lock, AlertCircle } from "lucide-react";
import type { BallotInfo } from "@/hooks/useSecretBallotBox";

interface VotingModalProps {
  ballot: BallotInfo | null;
  isOpen: boolean;
  isVoting: boolean;
  onClose: () => void;
  onVote: (ballotId: number, candidateIndex: number) => void;
}

export function VotingModal({ ballot, isOpen, isVoting, onClose, onVote }: VotingModalProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCandidate(null);
    }
  }, [isOpen]);

  if (!isOpen || !ballot) return null;

  const handleSubmitVote = () => {
    if (selectedCandidate !== null) {
      onVote(ballot.id, selectedCandidate);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cast Your Vote</h2>
            <p className="text-sm text-gray-600 mt-1">
              Your vote will be encrypted and anonymous
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isVoting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Ballot Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">{ballot.title}</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>Total votes so far: {ballot.totalVotes}</p>
              <p>Ends: {new Date(ballot.endTime * 1000).toLocaleString()}</p>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">🔒 Your Privacy is Protected</p>
                <p>Your vote is encrypted using FHEVM technology. No one can see your choice until results are revealed.</p>
              </div>
            </div>
          </div>

          {/* Candidates */}
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-gray-900 flex items-center">
              Select a candidate:
              <span className="ml-2 text-sm text-red-500">*</span>
            </h4>
            
            {ballot.candidates.map((candidate, index) => (
              <label
                key={index}
                className={`
                  block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${selectedCandidate === index
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="candidate"
                    value={index}
                    checked={selectedCandidate === index}
                    onChange={() => setSelectedCandidate(index)}
                    disabled={isVoting}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {candidate}
                    </div>
                    <div className="text-sm text-gray-500">
                      Option {index + 1}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Warning */}
          {selectedCandidate !== null && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">⚠️ Confirm Your Choice</p>
                  <p>
                    You selected: <strong>{ballot.candidates[selectedCandidate]}</strong>
                  </p>
                  <p className="mt-1">
                    Once submitted, your vote cannot be changed. Make sure this is your final choice.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isVoting}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitVote}
            disabled={selectedCandidate === null || isVoting}
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
          >
            {isVoting ? (
              <>
                <div className="spinner" />
                <span>Encrypting Vote...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Cast Encrypted Vote</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


