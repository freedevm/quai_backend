const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const quais = require('quais')
const User = require('../models/User');
const contractAbi = require('../contract/contractABI.json');
require('dotenv').config();

const contractABI = [
  'function getContractBalance() view returns (uint256)',
  'event Deposit(address indexed user, uint256 amount)'
]

const PROVIDER_URL = process.env.PROVIDER_URL; // e.g., Infura, Alchemy, or http://localhost:8545
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new quais.JsonRpcProvider(PROVIDER_URL, undefined, {usePathing: true});

async function getContract() {
  const blackjackContract = new quais.Contract(CONTRACT_ADDRESS, contractABI, provider);
  return blackjackContract;
}

// Generate JWT token
const generateToken = (address) => {
  return jwt.sign({ address }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Get nonce for a user
const getNonce = async (req, res) => {
  try {
    const { address } = req.params;

    let user = await User.findOne({ address });

    if (!user) {
      user = await User.create({ address });
    }

    res.json({ nonce: user.nonce });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Handle login with signature
const login = async (req, res) => {
  try {
    const { address, signature } = req.body;

    if (!address || !signature) {
      return res.status(400).json({ error: 'Address and signature are required' });
    }

    const user = await User.findOne({ address });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify signature
    const message = `Login with nonce: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Update nonce
    user.nonce = Math.floor(Math.random() * 1000000);
    await user.save();

    // Generate JWT
    const token = generateToken(address);

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Access protected route
const getBalance = async (req, res) => {
  try {
    const user = await User.findOne({ address: req.user.address });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Protected data', user: { address: user.address, balance: user.balance, gameBalance: user.gameBalance } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findOne({ address: req.user.address });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (Number(user.balance) < Number(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const contract = await getContract();
    const amountInWei = ethers.parseEther(amount.toString());
    
    // Check contract balance
    const contractBalance = await contract.getContractBalance();
    console.log("contract balance => ", contractBalance)
    if (contractBalance < amountInWei) {
      return res.status(400).json({ error: 'Contract has insufficient balance' });
    }

    // Use a signer for the transaction
    const wallet = new quais.Wallet(process.env.PRIVATE_KEY, provider);
    const contractWithSigner = new quais.Contract(CONTRACT_ADDRESS, contractAbi, wallet)

    // Execute withdrawal
    const withdrawTx = await contractWithSigner.withdrawToUser(user.address, amountInWei);
    await withdrawTx.wait();

    // Update user balance (assuming you track it in the database)
    user.balance = (Number(user.balance) - Number(amount)).toString();
    await user.save();

    console.log("Withdrawal successful")
    res.json({ message: 'Withdrawal successful', amount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getNonce, login, getBalance, withdraw };