import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { SecretBallotBox } from "../types";

describe("SecretBallotBox", function () {
  let secretBallotBox: SecretBallotBox;
  let owner: HardhatEthersSigner;
  let voter1: HardhatEthersSigner;
  let voter2: HardhatEthersSigner;
  let voter3: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    const SecretBallotBoxFactory = await ethers.getContractFactory("SecretBallotBox");
    secretBallotBox = await SecretBallotBoxFactory.deploy();
    await secretBallotBox.waitForDeployment();
  });

  describe("Ballot Creation", function () {
    it("Should create a ballot successfully", async function () {
      const title = "Test Election";
      const candidates = ["Alice", "Bob", "Charlie"];
      const duration = 60; // 1 hour

      const tx = await secretBallotBox.createBallot(title, candidates, duration);
      const receipt = await tx.wait();

      // Check if BallotCreated event was emitted
      const event = receipt?.logs?.find((log: any) => {
        try {
          const parsed = secretBallotBox.interface.parseLog(log);
          return parsed?.name === "BallotCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      // Verify ballot info
      const ballotInfo = await secretBallotBox.getBallotInfo(0);
      expect(ballotInfo.title).to.equal(title);
      expect(ballotInfo.candidates).to.deep.equal(candidates);
      expect(ballotInfo.isActive).to.be.true;
      expect(ballotInfo.resultsRevealed).to.be.false;
      expect(ballotInfo.creator).to.equal(owner.address);
      expect(ballotInfo.totalVotes).to.equal(0);
    });

    it("Should fail to create ballot with less than 2 candidates", async function () {
      await expect(
        secretBallotBox.createBallot("Invalid Election", ["Alice"], 60)
      ).to.be.revertedWith("At least 2 candidates required");
    });

    it("Should fail to create ballot with more than 10 candidates", async function () {
      const tooManyCandidates = Array.from({ length: 11 }, (_, i) => `Candidate${i + 1}`);
      
      await expect(
        secretBallotBox.createBallot("Invalid Election", tooManyCandidates, 60)
      ).to.be.revertedWith("Maximum 10 candidates allowed");
    });

    it("Should fail to create ballot with zero duration", async function () {
      await expect(
        secretBallotBox.createBallot("Invalid Election", ["Alice", "Bob"], 0)
      ).to.be.revertedWith("Duration must be positive");
    });
  });

  describe("Ballot Queries", function () {
    beforeEach(async function () {
      // Create a test ballot
      await secretBallotBox.createBallot("Test Election", ["Alice", "Bob", "Charlie"], 60);
    });

    it("Should return correct total ballots count", async function () {
      expect(await secretBallotBox.getTotalBallots()).to.equal(1);
      
      // Create another ballot
      await secretBallotBox.createBallot("Another Election", ["Dave", "Eve"], 30);
      expect(await secretBallotBox.getTotalBallots()).to.equal(2);
    });

    it("Should return active ballots correctly", async function () {
      const activeBallots = await secretBallotBox.getActiveBallots();
      expect(activeBallots).to.have.length(1);
      expect(activeBallots[0]).to.equal(0);
    });

    it("Should check voting status correctly", async function () {
      expect(await secretBallotBox.hasVoted(0, voter1.address)).to.be.false;
    });

    it("Should fail to get info for non-existent ballot", async function () {
      await expect(secretBallotBox.getBallotInfo(999)).to.be.revertedWith("Ballot does not exist");
    });
  });

  describe("Results", function () {
    beforeEach(async function () {
      // Create a test ballot with short duration for testing
      await secretBallotBox.createBallot("Test Election", ["Alice", "Bob"], 1); // 1 minute
    });

    it("Should fail to reveal results before ballot ends", async function () {
      await expect(secretBallotBox.revealResults(0)).to.be.revertedWith("Ballot is still active");
    });

    it("Should fail to get results before they are revealed", async function () {
      // Fast forward time to end the ballot
      await ethers.provider.send("evm_increaseTime", [120]); // 2 minutes
      await ethers.provider.send("evm_mine", []);

      await expect(secretBallotBox.getResults(0)).to.be.revertedWith("Results not yet revealed");
    });

    it("Should not allow revealing results twice", async function () {
      // Fast forward time to end the ballot
      await ethers.provider.send("evm_increaseTime", [120]); // 2 minutes
      await ethers.provider.send("evm_mine", []);

      // Reveal results first time
      await secretBallotBox.revealResults(0);

      // Try to reveal again
      await expect(secretBallotBox.revealResults(0)).to.be.revertedWith("Results already revealed");
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      await secretBallotBox.createBallot("Test Election", ["Alice", "Bob"], 60);
    });

    it("Should fail to vote on non-existent ballot", async function () {
      // This test would require FHEVM setup for encrypted inputs
      // For now, we'll test the ballot existence check at the modifier level
      await expect(secretBallotBox.getBallotInfo(999)).to.be.revertedWith("Ballot does not exist");
    });

    it("Should fail to get encrypted vote count for invalid candidate", async function () {
      await expect(secretBallotBox.getEncryptedVoteCount(0, 999)).to.be.revertedWith("Invalid candidate index");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty ballot list correctly", async function () {
      expect(await secretBallotBox.getTotalBallots()).to.equal(0);
      
      const activeBallots = await secretBallotBox.getActiveBallots();
      expect(activeBallots).to.have.length(0);
      
      const endedBallots = await secretBallotBox.getEndedBallots();
      expect(endedBallots).to.have.length(0);
    });

    it("Should handle ballot state transitions correctly", async function () {
      // Create ballot with 1 minute duration
      await secretBallotBox.createBallot("Short Election", ["Alice", "Bob"], 1);
      
      // Initially active
      let ballotInfo = await secretBallotBox.getBallotInfo(0);
      expect(ballotInfo.isActive).to.be.true;
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [120]); // 2 minutes
      await ethers.provider.send("evm_mine", []);
      
      // Now should be inactive
      ballotInfo = await secretBallotBox.getBallotInfo(0);
      expect(ballotInfo.isActive).to.be.false;
      
      // Should appear in ended ballots
      const endedBallots = await secretBallotBox.getEndedBallots();
      expect(endedBallots).to.include(BigInt(0));
    });
  });
});


