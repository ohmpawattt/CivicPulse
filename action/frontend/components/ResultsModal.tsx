"use client";

import { useState, useEffect } from "react";
import { X, Trophy, Users, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { VoteResults } from "@/hooks/useSecretBallotBox";

interface ResultsModalProps {
  results: VoteResults | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResultsModal({ results, isOpen, onClose }: ResultsModalProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (results) {
      const data = results.candidates.map((candidate, index) => ({
        name: candidate,
        votes: results.results[index],
        percentage: results.totalVotes > 0 
          ? ((results.results[index] / results.totalVotes) * 100).toFixed(1)
          : "0.0"
      }));
      setChartData(data);
    }
  }, [results]);

  if (!isOpen || !results) return null;

  const maxVotes = Math.max(...results.results);
  const winners = results.candidates.filter((_, index) => results.results[index] === maxVotes);
  
  // Colors for the bar chart
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              Election Results
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Ballot #{results.ballotId} • Final Results
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{results.totalVotes}</div>
              <div className="text-sm text-blue-700">Total Votes</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{maxVotes}</div>
              <div className="text-sm text-green-700">Winning Votes</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">{results.candidates.length}</div>
              <div className="text-sm text-purple-700">Candidates</div>
            </div>
          </div>

          {/* Winner Announcement */}
          {winners.length === 1 ? (
            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
              <div className="text-center">
                <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-yellow-900 mb-2">
                  🎉 Winner: {winners[0]}
                </h3>
                <p className="text-yellow-800">
                  Congratulations! {winners[0]} won with {maxVotes} votes 
                  ({results.totalVotes > 0 ? ((maxVotes / results.totalVotes) * 100).toFixed(1) : "0"}% of total votes)
                </p>
              </div>
            </div>
          ) : winners.length > 1 ? (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
              <div className="text-center">
                <Trophy className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-blue-900 mb-2">
                  🤝 It's a Tie!
                </h3>
                <p className="text-blue-800">
                  {winners.join(" and ")} tied with {maxVotes} votes each
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <div className="text-center">
                <p className="text-gray-600">No votes were cast in this ballot.</p>
              </div>
            </div>
          )}

          {/* Chart */}
          {results.totalVotes > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vote Distribution</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                      formatter={(value, name) => [`${value} votes`, "Votes"]}
                      labelFormatter={(label) => `Candidate: ${label}`}
                    />
                    <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detailed Results Table */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Candidate</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Votes</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {chartData
                    .sort((a, b) => b.votes - a.votes)
                    .map((candidate, index) => {
                      const isWinner = candidate.votes === maxVotes && maxVotes > 0;
                      return (
                        <tr key={candidate.name} className={isWinner ? "bg-yellow-50" : "bg-white"}>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${isWinner ? "text-yellow-900" : "text-gray-900"}`}>
                                #{index + 1}
                              </span>
                              {isWinner && <Trophy className="h-4 w-4 text-yellow-600 ml-2" />}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`font-medium ${isWinner ? "text-yellow-900" : "text-gray-900"}`}>
                              {candidate.name}
                              {isWinner && <span className="ml-2 text-xs text-yellow-700">WINNER</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-mono text-sm ${isWinner ? "text-yellow-900" : "text-gray-900"}`}>
                              {candidate.votes}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-mono text-sm ${isWinner ? "text-yellow-900" : "text-gray-600"}`}>
                              {candidate.percentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔓</div>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Results Decrypted</p>
                <p>
                  These results were obtained by decrypting the encrypted votes using FHEVM technology. 
                  Individual votes remain anonymous and private.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="btn-primary w-full"
          >
            Close Results
          </button>
        </div>
      </div>
    </div>
  );
}


