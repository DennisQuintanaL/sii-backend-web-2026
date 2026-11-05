const express = require('express');
const router = express.Router();
const { getAsesorias, createAsesoria, inscribirAsesoria } = require('../controllers/extraController');
const { extractToken } = require('../middlewares/verifyToken');

// Protegemos las rutas extra para que solo usuarios logueados accedan
router.use(extractToken);

router.get('/', getAsesorias);
router.post('/', createAsesoria);
router.post('/inscripcion', inscribirAsesoria);

module.exports = router;