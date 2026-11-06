const express = require('express');
const router = express.Router();
const {
    getAsesorias,
    createAsesoria,
    inscribirAsesoria,
    updateAsesoria,
    deleteAsesoria,
} = require('../controllers/extraController');

// Montado en index.js como: app.use('/api/local/asesorias', verifyToken, extraRouter)

router.get('/', getAsesorias);                        // GET    /api/local/asesorias           (solo futuras)
router.post('/', createAsesoria);                     // POST   /api/local/asesorias
router.post('/inscripcion', inscribirAsesoria);       // POST   /api/local/asesorias/inscripcion
router.put('/:id', updateAsesoria);                   // PUT    /api/local/asesorias/:id       (solo el tutor)
router.delete('/:id', deleteAsesoria);                // DELETE /api/local/asesorias/:id       (solo el tutor)

module.exports = router;