# FlightSurety

This is a flight insurance decentralized application for registering airlines that offer flight delay insurance, and passengers who carry this insurance, gets paid in the event their flight is delayed.
It contain multiple smart contracts which are autonomously triggered by external sources, and which handle payments based on flight delay scenarios. There external resources must be registered in the smart contract as Oracles in order for them to interact with it

## Description
This project contains:
- 2 Smart Contract code under `contracts/` directory, which are `FlightSuretyApp` for Dapp Logic & `FlightSuretyData` for data
- Tests files using truffle under `test/` directory
- Front-end Dapp under `src/dapp/` directory
- Server app under `src/server/` directory


## Requiments
```
Truffle version: v4.1.14 (core: 4.1.14)
Solidity version: v0.4.24 (solc-js)
node version: v10.16.3
web3 version: ^1.2.6
```

## Getting started
all dependcies can be installed [nvm](https://github.com/nvm-sh/nvm) and running the following commands from the project directory:
```
sudo snap install -y curl
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash 
source ~/.profile
nvm install 12.22.12
npm install -g truffle@4.1.17
npm install
```

## Run Test
To run truffle tests:

`truffle test`

## Run FrontEnd Dapp
```
truffle migrate
npm run dapp
```
The dapp will run: http://localhost:8000


## Develop Server
```
npm run server
```

## Resources I Used
* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)