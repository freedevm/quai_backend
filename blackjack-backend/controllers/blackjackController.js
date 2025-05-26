const User = require('../models/User');
const BlackjackGame = require('../models/BlackjackGame');

const createDeck = () => {
    const suits = ['♠️', '♦️', '♣️', '♥️'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            let cardValue = value === 'A' ? 11 : 
                            ['J', 'Q', 'K'].includes(value) ? 10 : 
                            parseInt(value);
            deck.push({ suit, value: cardValue, name: `${value} ${suit}` });
        }
    }
    // Use Fisher-Yates shuffle instead of sort with random
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const handTotal = (hand) => {
    if (!Array.isArray(hand) || hand.some(card => !card || typeof card.value !== 'number')) {
        throw new Error('Invalid hand: must be an array of card objects with numeric values');
    }

    let total = 0;
    let aceCount = 0;

    hand.forEach(card => {
        if (card.value === 11) {
            aceCount++;
        }
        total += card.value;
    });

    while (total > 21 && aceCount > 0) {
        total -= 10;
        aceCount--;
    }

    return total;
};

const startGame = async (req, res) => {
    try {
        const { address } = req.user;
        const { betAmount } = req.body;

        const existingGame = await BlackjackGame.findOne({ 
            userAddress: address,
            gameStatus: 0
        });

        if (existingGame) {
            return res.status(400).json({ error: 'Finish your current game first' });
        }
  
        // Validate bet amount
        if (!betAmount || parseFloat(betAmount) <= 0) {
            return res.status(400).json({ error: 'Please enter a valid bet amount' });
        }
    
        // Find user
        const user = await User.findOne({ address });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
    
        // Check if user has sufficient balance
        const userBalance = parseFloat(user.balance);
        const bet = parseFloat(betAmount);
        if (userBalance < bet) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
  
        // Update user's balance and gameBalance
        user.balance = (userBalance - bet).toString();
        user.gameBalance = (parseFloat(user.gameBalance) + bet).toString();
        await user.save();
    
        // Create and save new game
        const deck = createDeck();
        const playerCards = [deck.pop(), deck.pop()];
        const dealerCards = [deck.pop()];
        const game = new BlackjackGame({
            userAddress: address,
            playerHand: playerCards,
            dealerHand: dealerCards,
            deck,
            betAmount,
        });
        await game.save();
  
        // Check for immediate blackjack
        if (playerCards.length === 2 && handTotal(playerCards) === 21) {
            const currentGame = await BlackjackGame.findOne({ userAddress: address, gameStatus: 0 });
            currentGame.gameStatus = 2;

            const user = await User.findOne({ address });
            let userBalance = parseFloat(user.balance);
            let gameBalance = parseFloat(user.gameBalance);

            userBalance += gameBalance * 2;

            user.balance = userBalance.toString();
            user.gameBalance = "0";

            await currentGame.save();
            await user.save();

            return res.json({ message: 'Blackjack! You win right away!', game });
        }
  
        res.json({ message: 'Game started! Hit or Stand?', game });
    } catch (error) {
        res.status(500).json({ error: 'Game start failed' });
    }
};

const hit = async (req, res) => {
    try {
        const { address } = req.user;
        const game = await BlackjackGame.findOne({ userAddress: address, gameStatus: 0 });

        if (!game || game.deck.length === 0) {
            return res.status(400).json({ error: 'Invalid game state' });
        }

        if (!game.splitHand.length) {
            const newCard = game.deck.pop();
            game.playerHand.push(newCard);
            const total = handTotal(game.playerHand);

            if (total > 21) {
                game.gameStatus = 2;

                const user = await User.findOne({ address });
                user.gameBalance = "0";

                await game.save();
                await user.save();
                
                return res.json({ message: `Busted! Total: ${total}. Dealer wins.`, game });
            } else if (total === 21) {
                game.gameStatus = 1;

                while (handTotal(game.dealerHand) < 17 && game.deck.length > 0) {
                    game.dealerHand.push(game.deck.pop());
                }

                const result = await game.save();

                if (result) {
                    resolveGame(req, res);
                }
                
                return;
            }

            await game.save();
            res.json({ message: `Hit or Stand? (Total: ${total})`, game });
        } else {
            game.playerHand.push(game.deck.pop());
            game.splitHand.push(game.deck.pop());
            game.gameStatus = 1;

            while (handTotal(game.dealerHand) < 17 && game.deck.length > 0) {
                game.dealerHand.push(game.deck.pop());
            }

            const result = await game.save();

            if (result) {
                resolveGame(req, res);
            }
                
            return;
        }

        
    } catch (error) {
        res.status(500).json({ error: 'Hit failed' });
    }
};

const stand = async (req, res) => {
  try {
    const { address } = req.user;
    const game = await BlackjackGame.findOne({ userAddress: address, gameStatus: 0 });

    if (!game) return res.status(400).json({ error: 'Invalid game state' });

    game.gameStatus = 1;

    while (handTotal(game.dealerHand) < 17 && game.deck.length > 0) {
      game.dealerHand.push(game.deck.pop());
    }

    const result = await game.save();

    if (result) {
        resolveGame(req, res);
    }
  } catch (error) {
    res.status(500).json({ error: 'Stand failed' });
  }
};

const split = async (req, res) => {
  try {
    const { address } = req.user;
    
    const game = await BlackjackGame.findOne({ userAddress: address, gameStatus: 0 });

    if (!game || game.playerHand.length !== 2 || game.playerHand[0].value !== game.playerHand[1].value) {
      return res.status(400).json({ error: 'Can only split with two identical cards' });
    }

    const user = await User.findOne({ address });
    // Find user
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userBalance = parseFloat(user.balance);
    const bet = parseFloat(user.gameBalance);
    
    if (userBalance < bet) {
        return res.status(400).json({ error: 'Not enough Gaming Balance to split' });
    }

    // Update user's balance and gameBalance
    user.balance = (userBalance - bet).toString();
    user.gameBalance = (parseFloat(user.gameBalance) + bet).toString();
    await user.save();

    const newDeck = [...game.deck];
    game.splitHand = [game.playerHand[1], newDeck.pop()];
    game.playerHand = [game.playerHand[0], newDeck.pop()];
    game.deck = newDeck;
    await game.save();

    res.json({ message: 'Split successful! Play each hand separately.', game });
  } catch (error) {
    res.status(500).json({ error: 'Split failed' });
  }
};

const double = async (req, res) => {
  try {
    const { address } = req.user;
    const game = await BlackjackGame.findOne({ userAddress: address, gameStatus: 0 });

    if (!game || game.playerHand.length !== 2) {
      return res.status(400).json({ error: 'Can only double with initial two cards' });
    }

    const user = await User.findOne({ address });
    // Find user
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userBalance = parseFloat(user.balance);
    const bet = parseFloat(user.gameBalance);
    
    if (userBalance < bet) {
        return res.status(400).json({ error: 'Not enough Gaming Balance to double' });
    }

    // Update user's balance and gameBalance
    user.balance = (userBalance - bet).toString();
    user.gameBalance = (parseFloat(user.gameBalance) + bet).toString();
    await user.save();

    game.playerHand.push(game.deck.pop());
    await game.save();

    stand(req, res); // End turn after doubling
  } catch (error) {
    res.status(500).json({ error: 'Double failed' });
  }
};

const resolveGame = async (req, res) => {
    try {
        const { address } = req.user;
        const game = await BlackjackGame.findOne({ userAddress: address, gameStatus: 1 });
        if (!game) {
            return res.status(400).json({ error: 'Game not found' });
        }
    
        const user = await User.findOne({ address });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
    
        const playerTotal = handTotal(game.playerHand);
        const dealerTotal = handTotal(game.dealerHand);
        const splitTotal = game.splitHand ? handTotal(game.splitHand) : null;

        let messages = [];
    
        // Evaluate main hand
        const mainHandResult = evaluateHand(playerTotal, dealerTotal, 'First Hand');
        messages.push(mainHandResult.message);
    
        // Update balance for main hand
        const bet = parseFloat(user.gameBalance);
        let userBalance = parseFloat(user.balance);
        let userGameBalance = parseFloat(user.gameBalance);
    
        // Evaluate split hand if present
        if (!!splitTotal) {
            const splitHandResult = evaluateHand(splitTotal, dealerTotal, 'Second Hand');
            messages.push(splitHandResult.message);

            if (mainHandResult.outcome === 'win') userBalance += bet; // Return bet + win
            else if (mainHandResult.outcome === 'tie') userBalance += (bet / 2); // Return bet only
    
            // Update balance for split hand
            if (splitHandResult.outcome === 'win') userBalance += bet; // Return bet + win
            else if (splitHandResult.outcome === 'tie') userBalance += (bet / 2); // Return bet only

            userGameBalance = 0;
        } else {
            if (mainHandResult.outcome === 'win') userBalance += 2 * bet; // Return bet + win
            else if (mainHandResult.outcome === 'tie') userBalance += bet; // Return bet only
            userGameBalance = 0; // Lose bet
        }
    
        // Save updated user balances
        user.balance = userBalance.toString();
        user.gameBalance = userGameBalance.toString();
        await user.save();
    
        // Mark game as resolved
        game.gameStatus = 2;
        await game.save();
        
        res.json({ message: messages.join(' '), game });
    } catch (error) {
        res.status(500).json({ error: 'Game resolution failed' });
    }
};
  
const evaluateHand = (playerTotal, dealerTotal, handName) => {
    if (playerTotal > 21) {
        return { outcome: 'loss', message: `${handName}: You busted at ${playerTotal}. Dealer wins.` };
    } else if (dealerTotal > 21) {
        return { outcome: 'win', message: `${handName}: Dealer busted at ${dealerTotal}. You win with ${playerTotal}!` };
    } else if (playerTotal === 21 && dealerTotal === 21) {
        return { outcome: 'tie', message: `${handName}: Both have 21. It's a draw!` };
    } else if (playerTotal === 21) {
        return { outcome: 'win', message: `${handName}: You have 21 and dealer has ${dealerTotal}. You win!` };
    } else if (playerTotal > dealerTotal) {
        return { outcome: 'win', message: `${handName}: You win! (${playerTotal} vs ${dealerTotal})` };
    } else if (playerTotal < dealerTotal) {
        return { outcome: 'loss', message: `${handName}: Dealer wins! (${dealerTotal} vs ${playerTotal})` };
    } else {
        return { outcome: 'tie', message: `${handName}: It's a tie!` };
    }
};

module.exports = { startGame, hit, stand, split, double };