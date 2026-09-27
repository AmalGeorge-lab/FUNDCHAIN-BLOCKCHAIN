// npx hardhat test : for testing locally without persistence
// installed : npm install --save-dev @nomicfoundation/hardhat-ethers ethers
// installed : npm install --save-dev @nomicfoundation/hardhat-node-test-runner
/*
  for persistent local blockchain and Manual testing / React / MetaMask
  In Terminal 1 run : npx hardhat node
  In Terminal 2 run : npx hardhat run scripts/deploy.ts --network localhost

  there should be deploy.ts file in scripts folder for deployment
*/

import { beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Campaign", () => {
  let accounts:any[];
  let manager:any;
  let investor:any;
  let campaignFactory:any;
  let campaign:any;

  const minimumContribution = ethers.parseEther("0.01");

  beforeEach( async ()=>{
    accounts = await ethers.getSigners();
    manager = accounts[0];
    investor = accounts[1];

    const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    campaignFactory = await CampaignFactory.deploy();
    await campaignFactory.waitForDeployment();
    

    const newCampaign = await campaignFactory.createCampaign(minimumContribution);
    await newCampaign.wait();

    const deployedCampaigns =await campaignFactory.getDeployedCampaigns();
    const campaignAddress = deployedCampaigns[0];

    campaign = await ethers.getContractAt("Campaign",campaignAddress);
  });

  it("deploys the CampaignFactory", async () => {
    const address = await campaignFactory.getAddress();
    console.log("Factory deployed at address : ", await campaignFactory.getAddress());
    assert.notEqual(address, ethers.ZeroAddress);
  });

  it("creates a Campaign", async () => {
    const deployedCampaigns =await campaignFactory.getDeployedCampaigns();
    console.log("Campaign deployed at : " , deployedCampaigns[0]);
    assert.notEqual(deployedCampaigns[0] , ethers.ZeroAddress);
  });

  it("sets the correct manager", async () => {
    const campaignManager = await campaign.manager();
    console.log("Manager is : ", campaignManager , "and Campaign manager is : " , manager.address);
    assert.equal(campaignManager, manager.address);
  });

  it("allows people to contribute money and mark them as approvers" , async () => {
    const contribution = ethers.parseEther("0.02");
    await campaign.connect(investor).contribute({ value : contribution });
    const isApprover = await campaign.approvers(investor.address);
    assert.equal(isApprover, true);
    const count = await campaign.approversCount();
    assert.equal(count.toString(), "1");
  });

  it("requires minimum contribution" , async()=>{
    try {
      const contribution = ethers.parseEther("0.001");
      await campaign.connect(investor).contribute({ value : contribution });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("allows the manager to make a payment request" , async () => {
    const recipient = accounts[2].address;
    await campaign.connect(manager).createRequest("Buy equipment", ethers.parseEther("0.01") , recipient);
    const request = await campaign.requests(0);
    assert.equal(request.description, "Buy equipment");
    assert.equal(request.value.toString(),ethers.parseEther("0.01").toString());
    assert.equal(request.recipient, recipient);
    assert.equal(request.complete, false);
    assert.equal(request.approvalCount.toString(), "0");
  });

  it("process a request", async () => {
    const recipient = accounts[2];
    await campaign.connect(investor).contribute({value: ethers.parseEther("0.02")});
    await campaign.connect(manager).createRequest("Buy equipment",ethers.parseEther("0.01"),recipient.address);
    await campaign.connect(investor).approveRequest(0);

    const balanceBefore = await ethers.provider.getBalance(recipient.address);

    await campaign.connect(manager).finalizeRequest(0);

    const balanceAfter = await ethers.provider.getBalance(recipient.address);

    const request = await campaign.requests(0);
    assert.equal(request.complete, true);
    assert.equal((balanceAfter - balanceBefore).toString(),ethers.parseEther("0.01").toString());
  });

});