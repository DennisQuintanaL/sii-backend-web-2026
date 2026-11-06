const express = require('express');
const router = express.Router();
const { getAsesorias, createAsesoria, inscribirAsesoria } = require('../controllers/extraController');

// Montado en index.js como: app.use('/api/local/asesorias', verifyToken, extraRouter)

router.get('/', getAsesorias);                        // GET  /api/local/asesorias
router.post('/', createAsesoria);                     // POST /api/local/asesorias
router.post('/inscripcion', inscribirAsesoria);       // POST /api/local/asesorias/inscripcion

module.exports = router;