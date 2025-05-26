QuaiFly Blackjack Deposit Bot
Overview
This Node.js application is a bot that monitors deposit events on an Blackjack game contract and stores user balances and deposit records in a MongoDB database. It uses the quais library to interact with the Quai blockchain and mongoose for MongoDB integration.
The bot performs the following functions:

Connects to an Quai network via a provider (e.g., Infura, Alchemy, or a local node).
Listens for Deposit events emitted by a specified smart contract.
Processes past and real-time deposit events, updating user balances and saving deposit records.
Periodically rechecks for new events to ensure no events are missed.

Prerequisites

Node.js: Version 14 or higher.
MongoDB: A running MongoDB instance (local or cloud-based like MongoDB Atlas).
Quai Provider: Access to an Quai node (e.g., Infura, Alchemy, or a local node like Hardhat).
Environment Variables: A .env file with the required configuration.

Installation

Clone the repository:
git clone <repository-url>
cd <repository-directory>


Install dependencies:
npm install


Set up environment variables:Create a .env file in the root directory with the following variables:
PROVIDER_URL=<your-Quai-provider-url> # e.g., https://mainnet.infura.io/v3/YOUR_PROJECT_ID
CONTRACT_ADDRESS=<your-contract-address>  # Deployed contract address
MONGODB_URI=<your-mongodb-uri>           # e.g., mongodb://localhost:27017/deposit-bot

Example .env file:
PROVIDER_URL=https://mainnet.infura.io/v3/your-project-id
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
MONGODB_URI=mongodb://localhost:27017/deposit-bot



Project Structure

index.js: Main bot script that initializes the provider, contract, and event listeners.
models/User.js: Mongoose schema for storing user addresses and balances.
models/Deposit.js: Mongoose schema for storing deposit event records.
config/db.js: MongoDB connection configuration.
.env: Environment variables (not tracked in version control).

Usage

Start the bot:
node index.js


What the bot does:

Connects to the MongoDB database specified in MONGODB_URI.
Establishes a connection to the Quai network using the PROVIDER_URL.
Initializes the smart contract at CONTRACT_ADDRESS using the provided ABI.
Queries past Deposit events starting from the last processed block (or block 1422016 if no prior records exist).
Processes events by updating user balances in the User collection and saving deposit records in the Deposit collection.
Sets up real-time event listeners for new Deposit events.
Periodically (every 5 seconds) rechecks for new events to ensure reliability.


Stopping the bot:

Press Ctrl+C to gracefully shut down the bot. The MongoDB connection will be closed, and the process will exit cleanly.



Smart Contract ABI
The bot interacts with a smart contract that supports the following:

Function: getContractBalance() - Returns the contract's balance (in Wei).
Event: Deposit(address indexed user, uint256 amount) - Emitted when a user deposits funds.

Ensure the contract deployed at CONTRACT_ADDRESS matches this ABI.
Database Schema

User:
address: Quai address of the user (string).
balance: User's total balance in Ether (string).


Deposit:
block: Block number of the deposit event (number).
address: Quai address of the user (string).
amount: Deposit amount in Ether (number).



Error Handling

The bot retries starting every 10 seconds if an error occurs during initialization.
Errors in event processing are logged to the console but do not crash the bot.
Ensure the Quai provider and MongoDB database are accessible to avoid connection issues.

Development Notes

The bot assumes 18 decimals for the token/contract (standard for Ether). If the contract uses a different number of decimals, update the decimals variable in setupEventListeners.
The starting block number (1422016) is hardcoded as a fallback. Adjust this in the code if you need to start from a different block.
The bot checks for new events every 5 seconds to handle potential missed events due to network issues or chain reorganizations.

Troubleshooting

MongoDB connection issues: Verify the MONGODB_URI in the .env file and ensure the MongoDB instance is running.
Provider connection issues: Check the PROVIDER_URL and ensure you have a valid API key (for Infura/Alchemy) or a running local node.
No events processed: Confirm the CONTRACT_ADDRESS is correct and that the contract emits Deposit events as expected.
Balance inaccuracies: Ensure the decimals value matches the contract's token decimals.

License
This project is licensed under the MIT License. See the LICENSE file for details.
Contributing
Contributions are welcome! Please submit a pull request or open an issue for any bugs, features, or improvements.
