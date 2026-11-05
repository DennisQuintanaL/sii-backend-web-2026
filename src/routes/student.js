const express = require('express');
const router = express.Router();
const { getPerfil, getCalificaciones, getKardex, getHorarios } = require('../controllers/itcController');
const { extractToken } = require('../middlewares/verifyToken');

// Ejecuta el middleware de extracción de cookie en todas las rutas
router.use(extractToken);

router.get('/estudiante', getPerfil);
router.get('/calificaciones', getCalificaciones);
router.get('/kardex', getKardex);
router.get('/horarios', getHorarios);

module.exports = router;