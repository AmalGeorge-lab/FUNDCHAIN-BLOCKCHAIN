// to deploy in sepolia network : npx hardhat run scripts/deploy.ts --network sepolia
// to deploy in local network : npx hardhat run scripts/deploy.ts --network localhost
import hre from "hardhat";

const deployCampaignContract = async () => {
  const { ethers } = await hre.network.create();
  console.log("Deploying Campaign contract...");
  const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
  const campaign = await CampaignFactory.deploy();
  await campaign.waitForDeployment();
  const address = await campaign.getAddress();
  console.log("Campaign deployed to : ", address);
}

deployCampaignContract().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});