/*
to compile type : npx hardhat compile
then hardhat generates compiled artifacts under
artifacts/
└── contracts/
    └── Campaign.sol/
        └── Campaign.json
That JSON contains important information such as:ABI , bytecode , contract metadata
You'll later use the ABI + deployed contract address to connect your React frontend with the contract.
*/


// put contracts in contracts folder. So hardhat identifies it automatically and compile it