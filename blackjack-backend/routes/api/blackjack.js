const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middlewares/auth');
const {
    startGame,
    hit,
    stand,
    split,
    double,
} = require('../../controllers/blackjackController');

// Game routes
router.post('/start', authenticateToken, startGame);
router.post('/hit', authenticateToken, hit);
router.post('/stand', authenticateToken, stand);
router.post('/split', authenticateToken, split);
router.post('/double', authenticateToken, double);

module.exports = router;