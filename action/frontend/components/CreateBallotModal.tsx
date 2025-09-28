"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, AlertCircle, Clock } from "lucide-react";

interface CreateBallotModalProps {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreate: (title: string, candidates: string[], durationMinutes: number) => void;
}

export function CreateBallotModal({ isOpen, isCreating, onClose, onCreate }: CreateBallotModalProps) {
  const [title, setTitle] = useState("");
  const [candidates, setCandidates] = useState<string[]>(["", ""]);
  const [duration, setDuration] = useState(60); // Default 1 hour
  const [durationType, setDurationType] = useState<"minutes" | "hours" | "days">("hours");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setCandidates(["", ""]);
      setDuration(60);
      setDurationType("hours");
    }
  }, [isOpen]);

  const addCandidate = () => {
    if (candidates.length < 10) {
      setCandidates([...candidates, ""]);
    }
  };

  const removeCandidate = (index: number) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const updateCandidate = (index: number, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = value;
    setCandidates(newCandidates);
  };

  const getDurationInMinutes = () => {
    switch (durationType) {
      case "minutes":
        return duration;
      case "hours":
        return duration * 60;
      case "days":
        return duration * 60 * 24;
      default:
        return duration;
    }
  };

  const getEstimatedEndTime = () => {
    const endTime = new Date(Date.now() + getDurationInMinutes() * 60 * 1000);
    return endTime.toLocaleString();
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    const trimmedCandidates = candidates.map(c => c.trim()).filter(c => c.length > 0);
    
    if (trimmedTitle && trimmedCandidates.length >= 2) {
      onCreate(trimmedTitle, trimmedCandidates, getDurationInMinutes());
    }
  };

  const isValid = () => {
    const trimmedTitle = title.trim();
    const trimmedCandidates = candidates.map(c => c.trim()).filter(c => c.length > 0);
    return trimmedTitle.length > 0 && trimmedCandidates.length >= 2 && duration > 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Ballot</h2>
            <p className="text-sm text-gray-600 mt-1">
              Set up a new private voting ballot
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="label block mb-2">
              Ballot Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
              placeholder="e.g., Presidential Election 2024"
              className="input"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="label block mb-2">
              Voting Duration <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isCreating}
                min="1"
                max={durationType === "minutes" ? 1440 : durationType === "hours" ? 168 : 30}
                className="input flex-1"
              />
              <select
                value={durationType}
                onChange={(e) => setDurationType(e.target.value as "minutes" | "hours" | "days")}
                disabled={isCreating}
                className="input w-32"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Ends: {getEstimatedEndTime()}</span>
            </div>
          </div>

          {/* Candidates */}
          <div>
            <label className="label block mb-2">
              Candidates <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(2-10 candidates required)</span>
            </label>
            <div className="space-y-3">
              {candidates.map((candidate, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                  <input
                    type="text"
                    value={candidate}
                    onChange={(e) => updateCandidate(index, e.target.value)}
                    disabled={isCreating}
                    placeholder={`Candidate ${index + 1} name`}
                    className="input flex-1"
                    maxLength={50}
                  />
                  {candidates.length > 2 && (
                    <button
                      onClick={() => removeCandidate(index)}
                      disabled={isCreating}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Candidate Button */}
            {candidates.length < 10 && (
              <button
                onClick={addCandidate}
                disabled={isCreating}
                className="mt-3 flex items-center space-x-2 text-primary hover:text-primary/80 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add Candidate</span>
              </button>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔒</div>
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">Privacy Guaranteed</p>
                <p>
                  All votes will be encrypted using FHEVM technology. Individual votes remain 
                  completely private and anonymous until results are revealed at the end.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Warnings */}
          {!isValid() && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Please complete the following:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {!title.trim() && <li>Enter a ballot title</li>}
                    {candidates.filter(c => c.trim()).length < 2 && <li>Add at least 2 candidates</li>}
                    {duration <= 0 && <li>Set a valid duration</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid() || isCreating}
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
          >
            {isCreating ? (
              <>
                <div className="spinner" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Create Ballot</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


