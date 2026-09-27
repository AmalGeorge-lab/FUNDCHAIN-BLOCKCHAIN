// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;


contract CampaignFactory{
  address[] public deployedCampaigns;

  function createCampaign(uint minimum) public {
    address newCampaign = address(new Campaign(minimum , msg.sender));
    deployedCampaigns.push(newCampaign);
  }

  function getDeployedCampaigns() public view returns (address[] memory){
    return deployedCampaigns;
  }

}



contract Campaign {

  struct Request{
    string description;
    uint value;
    address payable recipient;
    bool complete;
    uint approvalCount;
    mapping(address => bool) approvals;
  }

  Request[] public requests; 
  address public manager;
  uint public minimumContribution;
  mapping(address => bool) public approvers;
  uint public approversCount;


  modifier restricted(){
    require(msg.sender == manager);
    _;
  }

  constructor(uint minimum , address creator){
    manager = creator;
    minimumContribution = minimum;
  }

  function contribute() public payable {
    require(msg.value > minimumContribution);
    require(!approvers[msg.sender], "Already an approver");
    approvers[msg.sender] = true;
    approversCount++;
  }

  function createRequest(string memory description,uint value,address payable recipient) public restricted {
    requests.push();
    Request storage newRequest = requests[requests.length - 1];
    newRequest.description = description;
    newRequest.value = value;
    newRequest.recipient = recipient;
    newRequest.complete = false;
    newRequest.approvalCount = 0;
  }

  function approveRequest(uint index) public{
    require(approvers[msg.sender]);
    require(!requests[index].approvals[msg.sender]);
    requests[index].approvals[msg.sender] = true;
    requests[index].approvalCount++;
  }

  function finalizeRequest(uint index) public restricted {
    require(requests[index].approvalCount > (approversCount / 2));
    require(!requests[index].complete);
    (bool success, ) = requests[index].recipient.call{value: requests[index].value}("");
    require(success, "Transfer failed");
    requests[index].complete = true;
  }

  function getSummary() public view returns(uint , uint , uint , uint , address){
    return(minimumContribution , address(this).balance , requests.length , approversCount , manager);
  }

  function getRequestsCount() public view returns(uint){
    return requests.length;
  }

  function hasApproved(uint requestIndex, address user) public view returns (bool) {
    return requests[requestIndex].approvals[user];
  }

}