const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// Define el endpoint local (POST /api/local/login)
router.post('/login', login);

router.post('/logout', (req, res) => {
    res.clearCookie('sii_token', { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none', 
        path: '/' 
    });
    res.json({ mensaje: 'Sesión cerrada' });
});

module.exports = router;