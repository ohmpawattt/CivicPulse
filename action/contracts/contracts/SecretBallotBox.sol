// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SecretBallotBox - A privacy-preserving voting system using FHEVM
/// @author SecretBallotBox Team
/// @notice This contract allows for encrypted voting where votes remain private until results are revealed
contract SecretBallotBox is SepoliaConfig {
    
    // Structs
    struct Ballot {
        string title;
        string[] candidates;
        uint256 endTime;
        bool isActive;
        bool resultsRevealed;
        address creator;
        uint256 totalVotes;
        mapping(uint256 => euint32) encryptedVotes; // candidateIndex => encrypted vote count
        mapping(uint256 => uint32) finalResults;    // candidateIndex => final vote count (after decryption)
        mapping(address => bool) hasVoted;          // voter => has voted
    }

    // State variables
    uint256 public ballotCounter;
    mapping(uint256 => Ballot) public ballots;
    
    // Events
    event BallotCreated(uint256 indexed ballotId, string title, address indexed creator, uint256 endTime);
    event VoteCast(uint256 indexed ballotId, address indexed voter);
    event ResultsRevealed(uint256 indexed ballotId, uint256[] results);
    
    // Modifiers
    modifier ballotExists(uint256 ballotId) {
        require(ballotId < ballotCounter, "Ballot does not exist");
        _;
    }
    
    modifier ballotActive(uint256 ballotId) {
        require(ballots[ballotId].isActive, "Ballot is not active");
        require(block.timestamp < ballots[ballotId].endTime, "Ballot has ended");
        _;
    }
    
    modifier ballotEnded(uint256 ballotId) {
        require(block.timestamp >= ballots[ballotId].endTime, "Ballot is still active");
        _;
    }
    
    modifier hasNotVoted(uint256 ballotId) {
        require(!ballots[ballotId].hasVoted[msg.sender], "Already voted");
        _;
    }

    /// @notice Create a new ballot
    /// @param title The title of the ballot
    /// @param candidates Array of candidate names
    /// @param durationMinutes How long the ballot should be active (in minutes)
    function createBallot(
        string calldata title,
        string[] memory candidates,
        uint256 durationMinutes
    ) external returns (uint256 ballotId) {
        require(candidates.length >= 2, "At least 2 candidates required");
        require(candidates.length <= 10, "Maximum 10 candidates allowed");
        require(durationMinutes > 0, "Duration must be positive");
        
        ballotId = ballotCounter++;
        Ballot storage ballot = ballots[ballotId];
        
        ballot.title = title;
        // Copy candidates array manually to avoid calldata to storage issue
        for (uint256 i = 0; i < candidates.length; i++) {
            ballot.candidates.push(candidates[i]);
        }
        ballot.endTime = block.timestamp + (durationMinutes * 60);
        ballot.isActive = true;
        ballot.resultsRevealed = false;
        ballot.creator = msg.sender;
        ballot.totalVotes = 0;
        
        // Initialize encrypted vote counts to zero
        for (uint256 i = 0; i < candidates.length; i++) {
            ballot.encryptedVotes[i] = FHE.asEuint32(0);
            FHE.allowThis(ballot.encryptedVotes[i]);
        }
        
        emit BallotCreated(ballotId, title, msg.sender, ballot.endTime);
    }

    /// @notice Cast an encrypted vote (simplified version)
    /// @param ballotId The ID of the ballot to vote on
    /// @param candidateIndex The plain candidate index (0-based)
    /// @dev In a real implementation, this would use encrypted input
    function vote(
        uint256 ballotId,
        uint8 candidateIndex
    ) external 
        ballotExists(ballotId) 
        ballotActive(ballotId) 
        hasNotVoted(ballotId) 
    {
        Ballot storage ballot = ballots[ballotId];
        
        // Validate candidate index
        require(candidateIndex < ballot.candidates.length, "Invalid candidate index");
        
        // Increment vote count for the selected candidate
        ballot.encryptedVotes[candidateIndex] = FHE.add(ballot.encryptedVotes[candidateIndex], FHE.asEuint32(1));
        
        // Grant access permissions
        FHE.allowThis(ballot.encryptedVotes[candidateIndex]);
        FHE.allow(ballot.encryptedVotes[candidateIndex], msg.sender);
        
        ballot.hasVoted[msg.sender] = true;
        ballot.totalVotes++;
        
        emit VoteCast(ballotId, msg.sender);
    }

    /// @notice Cast an encrypted vote using FHEVM encrypted input
    /// @param ballotId The ID of the ballot to vote on
    /// @param encryptedCandidateIndex The encrypted index of the chosen candidate
    /// @param inputProof The proof for the encrypted input
    function voteEncrypted(
        uint256 ballotId,
        externalEuint8 encryptedCandidateIndex,
        bytes calldata inputProof
    ) external 
        ballotExists(ballotId) 
        ballotActive(ballotId) 
        hasNotVoted(ballotId) 
    {
        Ballot storage ballot = ballots[ballotId];
        
        // Convert external encrypted input to internal encrypted type
        FHE.fromExternal(encryptedCandidateIndex, inputProof);
        
        // For simplicity in this version, we'll increment the first candidate as a placeholder
        // In a real implementation, you would use the encrypted candidateIndex properly
        ballot.encryptedVotes[0] = FHE.add(ballot.encryptedVotes[0], FHE.asEuint32(1));
        FHE.allowThis(ballot.encryptedVotes[0]);
        FHE.allow(ballot.encryptedVotes[0], msg.sender);
        
        ballot.hasVoted[msg.sender] = true;
        ballot.totalVotes++;
        
        emit VoteCast(ballotId, msg.sender);
    }

    /// @notice Set the results of a ballot (called after off-chain decryption)
    /// @param ballotId The ID of the ballot to set results for
    /// @param results Array of decrypted vote counts
    /// @dev This function should be called after decrypting the vote counts off-chain
    function setResults(uint256 ballotId, uint256[] calldata results) 
        external 
        ballotExists(ballotId) 
        ballotEnded(ballotId) 
    {
        Ballot storage ballot = ballots[ballotId];
        require(!ballot.resultsRevealed, "Results already revealed");
        require(results.length == ballot.candidates.length, "Invalid results length");
        
        // Store the decrypted results
        for (uint256 i = 0; i < results.length; i++) {
            ballot.finalResults[i] = uint32(results[i]);
        }
        
        ballot.resultsRevealed = true;
        
        emit ResultsRevealed(ballotId, results);
    }

    /// @notice Get encrypted vote count for a specific candidate (for off-chain decryption)
    /// @param ballotId The ID of the ballot
    /// @param candidateIndex The index of the candidate
    /// @return The encrypted vote count handle
    function getEncryptedVoteCount(uint256 ballotId, uint256 candidateIndex) 
        external 
        view 
        ballotExists(ballotId) 
        returns (euint32) 
    {
        require(candidateIndex < ballots[ballotId].candidates.length, "Invalid candidate index");
        return ballots[ballotId].encryptedVotes[candidateIndex];
    }

    /// @notice Get ballot information
    /// @param ballotId The ID of the ballot
    /// @return title The title of the ballot
    /// @return candidates Array of candidate names
    /// @return endTime When the ballot ends
    /// @return isActive Whether the ballot is still active
    /// @return resultsRevealed Whether results have been revealed
    /// @return creator The address that created the ballot
    /// @return totalVotes Total number of votes cast
    function getBallotInfo(uint256 ballotId) 
        external 
        view 
        ballotExists(ballotId) 
        returns (
            string memory title,
            string[] memory candidates,
            uint256 endTime,
            bool isActive,
            bool resultsRevealed,
            address creator,
            uint256 totalVotes
        ) 
    {
        Ballot storage ballot = ballots[ballotId];
        return (
            ballot.title,
            ballot.candidates,
            ballot.endTime,
            ballot.isActive && block.timestamp < ballot.endTime,
            ballot.resultsRevealed,
            ballot.creator,
            ballot.totalVotes
        );
    }

    /// @notice Get the final results of a ballot (only available after results are revealed)
    /// @param ballotId The ID of the ballot
    /// @return results Array of vote counts for each candidate
    function getResults(uint256 ballotId) 
        external 
        view 
        ballotExists(ballotId) 
        returns (uint256[] memory results) 
    {
        Ballot storage ballot = ballots[ballotId];
        require(ballot.resultsRevealed, "Results not yet revealed");
        
        results = new uint256[](ballot.candidates.length);
        for (uint256 i = 0; i < ballot.candidates.length; i++) {
            results[i] = ballot.finalResults[i];
        }
    }

    /// @notice Check if an address has voted on a specific ballot
    /// @param ballotId The ID of the ballot
    /// @param voter The address to check
    /// @return Whether the address has voted
    function hasVoted(uint256 ballotId, address voter) 
        external 
        view 
        ballotExists(ballotId) 
        returns (bool) 
    {
        return ballots[ballotId].hasVoted[voter];
    }

    /// @notice Get the total number of ballots created
    /// @return The total number of ballots
    function getTotalBallots() external view returns (uint256) {
        return ballotCounter;
    }

    /// @notice Get all active ballots
    /// @return activeBallotIds Array of active ballot IDs
    function getActiveBallots() external view returns (uint256[] memory activeBallotIds) {
        uint256 activeCount = 0;
        
        // First pass: count active ballots
        for (uint256 i = 0; i < ballotCounter; i++) {
            if (ballots[i].isActive && block.timestamp < ballots[i].endTime) {
                activeCount++;
            }
        }
        
        // Second pass: populate array
        activeBallotIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < ballotCounter; i++) {
            if (ballots[i].isActive && block.timestamp < ballots[i].endTime) {
                activeBallotIds[index] = i;
                index++;
            }
        }
    }

    /// @notice Get all ended ballots
    /// @return endedBallotIds Array of ended ballot IDs
    function getEndedBallots() external view returns (uint256[] memory endedBallotIds) {
        uint256 endedCount = 0;
        
        // First pass: count ended ballots
        for (uint256 i = 0; i < ballotCounter; i++) {
            if (block.timestamp >= ballots[i].endTime) {
                endedCount++;
            }
        }
        
        // Second pass: populate array
        endedBallotIds = new uint256[](endedCount);
        uint256 index = 0;
        for (uint256 i = 0; i < ballotCounter; i++) {
            if (block.timestamp >= ballots[i].endTime) {
                endedBallotIds[index] = i;
                index++;
            }
        }
    }
}