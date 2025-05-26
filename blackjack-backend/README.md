QuaiFly Blackjack - Backend
Overview
QuaiFly Blackjack is a web-based blackjack game that integrates with Quai blockchain wallets for authentication and in-game betting. Players can log in using their Quai wallet, place bets, and play blackjack against a virtual dealer. The backend is built with Node.js, Express, and MongoDB, handling game logic, user authentication, and balance management.
Features

Wallet Authentication: Users log in using their Quai wallet by signing a message with a nonce.
Blackjack Gameplay: Supports standard blackjack actions (Hit, Stand, Split, Double Down).
Balance Management: Tracks user balances and game bets, with virtual currency.
MongoDB Integration: Stores user data and game states persistently.
Secure API: Uses JWT for protected routes and CORS for frontend integration.

Prerequisites

Node.js: v16 or higher
MongoDB: A running MongoDB instance (local or cloud-based like MongoDB Atlas)
Quai Wallet: For testing authentication (e.g., MetaMask)
Frontend Client: A frontend application running on http://localhost:3000 (not included in this repository)

Installation

Clone the Repository:
git clone <repository-url>
cd blockchain-blackjack


Copy .env.sample to .env
Add your pegalus wallet private key to PRIVATE_KEY field on .env file
this private key must be owner's of smart contract

Install Dependencies:
npm install


Set Up Environment Variables: Create a .env file in the root directory with the following:
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
PORT=8080


Run the Server:
npm start

The server will start on http://localhost:8080 (or the port specified in .env).


Project Structure
├── config
│   └── db.js               # MongoDB connection setup
├── controllers
│   ├── authController.js   # Handles authentication logic
│   └── blackjackController.js # Handles blackjack game logic
├── middleware
│   └── auth.js            # JWT authentication middleware
├── models
│   ├── blackjack.js       # Mongoose schema for blackjack games
│   └── user.js            # Mongoose schema for users
├── routes
│   ├── api
│   │   ├── auth.js        # Authentication routes
│   │   └── blackjack.js   # Blackjack game routes
├── server.js              # Main server file
├── .env                   # Environment variables (not tracked)
└── package.json           # Project dependencies and scripts

API Endpoints
Authentication

GET /api/auth/nonce/:address: Retrieves a nonce for the given Quai address.
POST /api/auth/login: Logs in a user by verifying their signature. Requires address and signature in the body.
GET /api/auth/balance: (Protected) Returns the user's balance and game balance.
POST /api/auth/withdraw: (Protected) handle the withdraw request from the user.

Blackjack

POST /api/blackjack/start: (Protected) Starts a new game with a specified betAmount.
POST /api/blackjack/hit: (Protected) Draws a card for the player's hand.
POST /api/blackjack/stand: (Protected) Ends the player's turn and plays the dealer's hand.
POST /api/blackjack/split: (Protected) Splits the player's hand if eligible.
POST /api/blackjack/double: (Protected) Doubles the bet and draws one card, then stands.
GET /api/blackjack/resolve: (Protected) Resolves the game and updates balances.

Authentication Flow

The client requests a nonce for an Quai address (GET /api/auth/nonce/:address).
The client signs a message (Login with nonce: <nonce>) using the Quai wallet.
The client sends the address and signature to POST /api/auth/login.
The server verifies the signature using ethers.js and issues a JWT.
The JWT is used in the Authorization header (Bearer <token>) for protected routes.

Game Logic

Deck Creation: A standard 52-card deck is created and shuffled using the Fisher-Yates algorithm.
Hand Evaluation: Aces are counted as 1 or 11 to prevent busting. Face cards are worth 10.
Game States:
0: Active game (player's turn).
1: Player has stood (dealer's turn).
2: Game resolved.


Betting: Bets are deducted from the user's balance and added to the game balance. Winnings or losses are settled after resolution.

Error Handling

A global error handler catches unhandled errors and returns a 500 status with a generic message.
Specific routes return appropriate status codes (e.g., 400 for invalid requests, 401 for unauthorized access).

Development

Linting: Use eslint for code consistency (install with npm install eslint --save-dev).
Testing: Add unit tests using a framework like Jest (not included).
CORS: Configured to allow requests from http://localhost:3000. Update in server.js for production.

Deployment

Set up a production MongoDB database (e.g., MongoDB Atlas).
Update .env with production values.
Deploy to a platform like Heroku, Vercel, or a VPS.
Ensure the frontend URL is updated in the CORS configuration.

Known Limitations

No frontend is included; you must build a compatible client.
Virtual currency is used; no real cryptocurrency transactions.
Split hand gameplay requires sequential play (not fully parallel).
No support for insurance or side bets.

Contributing

Fork the repository.
Create a feature branch (git checkout -b feature-name).
Commit changes (git commit -m "Add feature").
Push to the branch (git push origin feature-name).
Open a pull request.

License
This project is licensed under the MIT License.
