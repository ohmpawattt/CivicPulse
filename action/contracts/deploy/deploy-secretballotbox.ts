import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying SecretBallotBox contract...");
  console.log("Deployer address:", deployer);

  const deployedSecretBallotBox = await deploy("SecretBallotBox", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });

  console.log(`SecretBallotBox contract deployed at: ${deployedSecretBallotBox.address}`);
  console.log(`Transaction hash: ${deployedSecretBallotBox.transactionHash}`);
  
  // Verify deployment
  if (deployedSecretBallotBox.newlyDeployed) {
    console.log("✅ SecretBallotBox contract successfully deployed!");
  } else {
    console.log("ℹ️  SecretBallotBox contract was already deployed");
  }
};

export default func;
func.id = "deploy_secretballotbox";
func.tags = ["SecretBallotBox"];


