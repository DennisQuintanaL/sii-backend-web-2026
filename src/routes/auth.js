const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// Define el endpoint local (POST /api/local/login)
router.post('/login', login);

module.exports = router;