const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // Asegúrate de que la ruta sea correcta según tus carpetas

// GET /api/local/asesorias -> Obtener lista con conteo de cupos
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('asesorias')
            .select('*, inscripciones_asesorias(count)');

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const lista = data.map(({ inscripciones_asesorias, ...a }) => {
            const inscritos = inscripciones_asesorias?.[0]?.count ?? 0;
            return {
                ...a,
                inscritos,
                cupo_disponible: Math.max(0, a.cupo_maximo - inscritos),
            };
        });

        res.json(lista);
    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor al obtener las asesorías.' });
    }
});

// POST /api/local/asesorias/inscripcion -> Inscribir alumno validando el cupo
router.post('/inscripcion', async (req, res) => {
    const { asesoria_id, alumno_id } = req.body; 

    if (!asesoria_id || !alumno_id) {
        return res.status(400).json({ error: 'Faltan datos requeridos (asesoria_id, alumno_id).' });
    }

    try {
        // 1. Obtener conteo actual de inscritos
        const { count, error: countError } = await supabase
            .from('inscripciones_asesorias')
            .select('*', { count: 'exact', head: true })
            .eq('asesoria_id', asesoria_id);

        if (countError) {
            return res.status(500).json({ error: countError.message });
        }

        // 2. Obtener cupo máximo de la asesoría
        const { data: asesoria, error: asesoriaError } = await supabase
            .from('asesorias')
            .select('cupo_maximo')
            .eq('id', asesoria_id)
            .single();

        if (asesoriaError) {
            return res.status(500).json({ error: 'Asesoría no encontrada o error en la consulta.' });
        }

        // 3. Validar si hay cupo disponible
        if (count >= asesoria.cupo_maximo) {
            return res.status(409).json({ error: 'Esta asesoría ya no tiene lugares disponibles.' });
        }

        // 4. Insertar la inscripción si pasó la validación
        const { data: inscripcion, error: insertError } = await supabase
            .from('inscripciones_asesorias')
            .insert([{ asesoria_id, alumno_id }])
            .select();

        if (insertError) {
            return res.status(500).json({ error: insertError.message });
        }

        res.status(201).json({ mensaje: 'Inscripción exitosa', data: inscripcion });
    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor al procesar la inscripción.' });
    }
});

module.exports = router;