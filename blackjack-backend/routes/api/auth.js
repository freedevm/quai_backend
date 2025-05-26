const express = require('express');
const router = express.Router();
const { getNonce, login, getBalance, withdraw } = require('../../controllers/authController');
const authenticateToken = require('../../middlewares/auth');

// Get nonce
router.get('/nonce/:address', getNonce);

// Login with signature
router.post('/login', login);

// Protected route
router.get('/balance', authenticateToken, getBalance);

router.post('/withdraw', authenticateToken, withdraw);

module.exports = router;