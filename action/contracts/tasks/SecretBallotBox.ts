import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the SecretBallotBox contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the SecretBallotBox contract
 *
 *   npx hardhat --network localhost task:create-ballot --title "Test Election" --candidates "Alice,Bob,Charlie" --duration 60
 *   npx hardhat --network localhost task:vote --ballot-id 0 --candidate-index 1
 *   npx hardhat --network localhost task:reveal-results --ballot-id 0
 *   npx hardhat --network localhost task:get-results --ballot-id 0
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:address
 *   - npx hardhat --network sepolia task:address
 */
task("task:address", "Prints the SecretBallotBox address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const secretBallotBox = await deployments.get("SecretBallotBox");

  console.log("SecretBallotBox address is " + secretBallotBox.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:create-ballot --title "Presidential Election" --candidates "Alice,Bob,Charlie" --duration 1440
 */
task("task:create-ballot", "Creates a new ballot")
  .addOptionalParam("address", "Optionally specify the SecretBallotBox contract address")
  .addParam("title", "The title of the ballot")
  .addParam("candidates", "Comma-separated list of candidate names")
  .addParam("duration", "Duration of the ballot in minutes")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const SecretBallotBoxDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretBallotBox");
    console.log(`SecretBallotBox: ${SecretBallotBoxDeployment.address}`);

    const signers = await ethers.getSigners();
    const secretBallotBoxContract = await ethers.getContractAt("SecretBallotBox", SecretBallotBoxDeployment.address);

    const title = taskArguments.title;
    const candidates = taskArguments.candidates.split(",").map((c: string) => c.trim());
    const duration = parseInt(taskArguments.duration);

    console.log(`Creating ballot: "${title}"`);
    console.log(`Candidates: ${candidates.join(", ")}`);
    console.log(`Duration: ${duration} minutes`);

    const tx = await secretBallotBoxContract.connect(signers[0]).createBallot(title, candidates, duration);
    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    // Get the ballot ID from the event
    const event = receipt?.logs?.find((log: any) => {
      try {
        const parsed = secretBallotBoxContract.interface.parseLog(log);
        return parsed?.name === "BallotCreated";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = secretBallotBoxContract.interface.parseLog(event);
      console.log(`Ballot created with ID: ${parsed?.args.ballotId}`);
    }

    console.log("Ballot creation completed!");
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:vote --ballot-id 0 --candidate-index 1
 */
task("task:vote", "Cast a vote on a ballot")
  .addOptionalParam("address", "Optionally specify the SecretBallotBox contract address")
  .addParam("ballotId", "The ID of the ballot to vote on")
  .addParam("candidateIndex", "The index of the candidate to vote for (0-based)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const ballotId = parseInt(taskArguments.ballotId);
    const candidateIndex = parseInt(taskArguments.candidateIndex);

    await fhevm.initializeCLIApi();

    const SecretBallotBoxDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretBallotBox");
    console.log(`SecretBallotBox: ${SecretBallotBoxDeployment.address}`);

    const signers = await ethers.getSigners();
    const secretBallotBoxContract = await ethers.getContractAt("SecretBallotBox", SecretBallotBoxDeployment.address);

    // Get ballot info first
    const ballotInfo = await secretBallotBoxContract.getBallotInfo(ballotId);
    console.log(`Voting on ballot: "${ballotInfo.title}"`);
    console.log(`Candidates: ${ballotInfo.candidates.join(", ")}`);
    console.log(`Voting for candidate index ${candidateIndex}: ${ballotInfo.candidates[candidateIndex]}`);

    // For now, use the simple vote function (not encrypted)
    // In a real implementation, you would use voteEncrypted with proper encryption
    const tx = await secretBallotBoxContract
      .connect(signers[0])
      .vote(ballotId, candidateIndex);
    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log("Vote cast successfully! 🗳️");
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:reveal-results --ballot-id 0
 */
task("task:reveal-results", "Reveal the results of a ballot by decrypting vote counts")
  .addOptionalParam("address", "Optionally specify the SecretBallotBox contract address")
  .addParam("ballotId", "The ID of the ballot to reveal results for")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const ballotId = parseInt(taskArguments.ballotId);

    await fhevm.initializeCLIApi();

    const SecretBallotBoxDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretBallotBox");
    console.log(`SecretBallotBox: ${SecretBallotBoxDeployment.address}`);

    const signers = await ethers.getSigners();
    const secretBallotBoxContract = await ethers.getContractAt("SecretBallotBox", SecretBallotBoxDeployment.address);

    // Get ballot info first
    const ballotInfo = await secretBallotBoxContract.getBallotInfo(ballotId);
    console.log(`Revealing results for ballot: "${ballotInfo.title}"`);

    // Decrypt vote counts for each candidate
    const results = [];
    console.log(`Decrypting votes for ${ballotInfo.candidates.length} candidates...`);
    
    for (let i = 0; i < ballotInfo.candidates.length; i++) {
      const encryptedVoteCount = await secretBallotBoxContract.getEncryptedVoteCount(ballotId, i);
      
      if (encryptedVoteCount === ethers.ZeroHash) {
        console.log(`Candidate ${i} (${ballotInfo.candidates[i]}): 0 votes (no encrypted data)`);
        results.push(0);
      } else {
        try {
          const clearVoteCount = await fhevm.userDecryptEuint(
            FhevmType.euint32,
            encryptedVoteCount,
            SecretBallotBoxDeployment.address,
            signers[0]
          );
          console.log(`Candidate ${i} (${ballotInfo.candidates[i]}): ${clearVoteCount} votes`);
          results.push(clearVoteCount);
        } catch (error) {
          console.log(`Failed to decrypt votes for candidate ${i}: ${error.message}`);
          results.push(0);
        }
      }
    }

    // Set the decrypted results in the contract
    const tx = await secretBallotBoxContract.connect(signers[0]).setResults(ballotId, results);
    console.log(`Setting results in contract: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    console.log("Results revealed successfully! 📊");
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-results --ballot-id 0
 */
task("task:get-results", "Get the results of a ballot")
  .addOptionalParam("address", "Optionally specify the SecretBallotBox contract address")
  .addParam("ballotId", "The ID of the ballot to get results for")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const ballotId = parseInt(taskArguments.ballotId);

    const SecretBallotBoxDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretBallotBox");
    console.log(`SecretBallotBox: ${SecretBallotBoxDeployment.address}`);

    const secretBallotBoxContract = await ethers.getContractAt("SecretBallotBox", SecretBallotBoxDeployment.address);

    // Get ballot info
    const ballotInfo = await secretBallotBoxContract.getBallotInfo(ballotId);
    console.log(`\n📊 Results for ballot: "${ballotInfo.title}"`);
    console.log(`Total votes: ${ballotInfo.totalVotes}`);
    console.log(`Results revealed: ${ballotInfo.resultsRevealed}`);

    if (!ballotInfo.resultsRevealed) {
      console.log("⚠️  Results have not been revealed yet. Use task:reveal-results first.");
      return;
    }

    // Get the results
    const results = await secretBallotBoxContract.getResults(ballotId);
    
    console.log("\n🏆 Final Results:");
    console.log("==================");
    
    let maxVotes = 0;
    let winners: string[] = [];
    
    for (let i = 0; i < ballotInfo.candidates.length; i++) {
      const votes = Number(results[i]);
      const percentage = ballotInfo.totalVotes > 0 ? (votes / Number(ballotInfo.totalVotes) * 100).toFixed(1) : "0.0";
      
      console.log(`${ballotInfo.candidates[i]}: ${votes} votes (${percentage}%)`);
      
      if (votes > maxVotes) {
        maxVotes = votes;
        winners = [ballotInfo.candidates[i]];
      } else if (votes === maxVotes && maxVotes > 0) {
        winners.push(ballotInfo.candidates[i]);
      }
    }
    
    if (winners.length === 1) {
      console.log(`\n🎉 Winner: ${winners[0]} with ${maxVotes} votes!`);
    } else if (winners.length > 1) {
      console.log(`\n🤝 Tie between: ${winners.join(", ")} with ${maxVotes} votes each!`);
    } else {
      console.log(`\n📝 No votes cast yet.`);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:list-ballots
 */
task("task:list-ballots", "List all ballots")
  .addOptionalParam("address", "Optionally specify the SecretBallotBox contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const SecretBallotBoxDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretBallotBox");
    console.log(`SecretBallotBox: ${SecretBallotBoxDeployment.address}`);

    const secretBallotBoxContract = await ethers.getContractAt("SecretBallotBox", SecretBallotBoxDeployment.address);

    const totalBallots = await secretBallotBoxContract.getTotalBallots();
    console.log(`\n📋 Total ballots: ${totalBallots}`);

    if (totalBallots == 0) {
      console.log("No ballots found. Create one using task:create-ballot");
      return;
    }

    console.log("\n🗳️  All Ballots:");
    console.log("================");

    for (let i = 0; i < totalBallots; i++) {
      const ballotInfo = await secretBallotBoxContract.getBallotInfo(i);
      const endDate = new Date(Number(ballotInfo.endTime) * 1000);
      const isActive = ballotInfo.isActive;
      const status = isActive ? "🟢 Active" : ballotInfo.resultsRevealed ? "🔓 Results Revealed" : "🔒 Ended (Pending Reveal)";
      
      console.log(`\nBallot #${i}: ${ballotInfo.title}`);
      console.log(`  Status: ${status}`);
      console.log(`  Candidates: ${ballotInfo.candidates.join(", ")}`);
      console.log(`  End Time: ${endDate.toLocaleString()}`);
      console.log(`  Total Votes: ${ballotInfo.totalVotes}`);
      console.log(`  Creator: ${ballotInfo.creator}`);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-vote-count --ballot-id 0 --candidate-index 0
 */
task("task:decrypt-vote-count", "Decrypt vote count for a specific candidate (for testing)")
  .addOptionalParam("address", "Optionally specify the SecretBallotBox contract address")
  .addParam("ballotId", "The ID of the ballot")
  .addParam("candidateIndex", "The index of the candidate")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const ballotId = parseInt(taskArguments.ballotId);
    const candidateIndex = parseInt(taskArguments.candidateIndex);

    await fhevm.initializeCLIApi();

    const SecretBallotBoxDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SecretBallotBox");
    console.log(`SecretBallotBox: ${SecretBallotBoxDeployment.address}`);

    const signers = await ethers.getSigners();
    const secretBallotBoxContract = await ethers.getContractAt("SecretBallotBox", SecretBallotBoxDeployment.address);

    // Get ballot info
    const ballotInfo = await secretBallotBoxContract.getBallotInfo(ballotId);
    console.log(`Ballot: "${ballotInfo.title}"`);
    console.log(`Candidate: ${ballotInfo.candidates[candidateIndex]}`);

    // Get encrypted vote count
    const encryptedVoteCount = await secretBallotBoxContract.getEncryptedVoteCount(ballotId, candidateIndex);
    
    if (encryptedVoteCount === ethers.ZeroHash) {
      console.log("Encrypted vote count: 0 (no votes)");
      return;
    }

    try {
      const clearVoteCount = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedVoteCount,
        SecretBallotBoxDeployment.address,
        signers[0]
      );
      console.log(`Current vote count for ${ballotInfo.candidates[candidateIndex]}: ${clearVoteCount}`);
    } catch (error) {
      console.log("Unable to decrypt vote count. This is expected if you don't have permission or the ballot has ended.");
      console.log("Error:", error.message);
    }
  });
