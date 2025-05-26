const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  suit: { type: String, required: true },
  value: { type: Number, required: true },
  name: { type: String, required: true },
});

const blackjackGameSchema = new mongoose.Schema({
  userAddress: { type: String, required: true, ref: 'User' },
  playerHand: [cardSchema],
  splitHand: [cardSchema],
  dealerHand: [cardSchema],
  deck: [cardSchema],
  gameStatus: { type: Number, default: 0 },
  betAmount: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BlackjackGame', blackjackGameSchema);