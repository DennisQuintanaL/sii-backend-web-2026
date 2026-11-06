const supabase = require('../config/supabase');

// 1. GET /api/local/asesorias
//    Lista de asesorías con inscritos y cupo_disponible calculados.
const getAsesorias = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('asesorias')
            .select('*, inscripciones_asesorias(count)')
            .order('fecha_hora', { ascending: true });

        if (error) throw error;

        const lista = data.map(({ inscripciones_asesorias, ...a }) => {
            const inscritos = inscripciones_asesorias?.[0]?.count ?? 0;
            return {
                ...a,
                inscritos,
                cupo_disponible: Math.max(0, a.cupo_maximo - inscritos),
            };
        });

        res.status(200).json(lista);
    } catch (error) {
        console.error('Error al obtener asesorías:', error.message);
        res.status(500).json({ error: 'No se pudieron obtener las asesorías' });
    }
};

// 2. POST /api/local/asesorias
//    Campos del contrato (openapi.yaml): los mismos nombres que las columnas de la tabla.
const createAsesoria = async (req, res) => {
    const {
        numero_control_tutor,
        nombre_tutor,
        materia_asesoria,
        descripcion_tema,
        ubicacion,
        fecha_hora,
        cupo_maximo,
    } = req.body;

    if (!numero_control_tutor || !nombre_tutor || !materia_asesoria || !descripcion_tema || !ubicacion || !fecha_hora) {
        return res.status(400).json({
            error: 'Faltan datos requeridos (numero_control_tutor, nombre_tutor, materia_asesoria, descripcion_tema, ubicacion, fecha_hora).',
        });
    }

    const cupo = cupo_maximo === undefined || cupo_maximo === null ? 5 : Number(cupo_maximo);
    if (!Number.isInteger(cupo) || cupo < 1) {
        return res.status(400).json({ error: 'cupo_maximo debe ser un entero mayor o igual a 1.' });
    }

    try {
        const { data, error } = await supabase
            .from('asesorias')
            .insert([{
                numero_control_tutor,
                nombre_tutor,
                materia_asesoria,
                descripcion_tema,
                ubicacion,
                fecha_hora,
                cupo_maximo: cupo,
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Asesoría publicada con éxito', data: data[0] });
    } catch (error) {
        console.error('Error al crear asesoría:', error.message);
        res.status(500).json({ error: 'No se pudo crear la asesoría' });
    }
};

// 3. POST /api/local/asesorias/inscripcion
//    Valida el cupo antes de insertar. Respuestas:
//      201 inscrito | 400 faltan datos | 404 asesoría no existe
//      409 con codigo YA_INSCRITO o CUPO_LLENO | 500 error interno
const inscribirAsesoria = async (req, res) => {
    const { asesoria_id, numero_control_alumno, nombre_alumno } = req.body;

    if (!asesoria_id || !numero_control_alumno || !nombre_alumno) {
        return res.status(400).json({
            error: 'Faltan datos requeridos (asesoria_id, numero_control_alumno, nombre_alumno).',
        });
    }

    try {
        // a) La asesoría debe existir y traemos su cupo.
        const { data: asesoria, error: asesoriaError } = await supabase
            .from('asesorias')
            .select('id, cupo_maximo')
            .eq('id', asesoria_id)
            .maybeSingle();

        if (asesoriaError) throw asesoriaError;
        if (!asesoria) {
            return res.status(404).json({ error: 'La asesoría no existe.' });
        }

        // b) Si ya está inscrito, se dice eso (aunque el cupo esté lleno).
        const { data: previa, error: previaError } = await supabase
            .from('inscripciones_asesorias')
            .select('asesoria_id')
            .eq('asesoria_id', asesoria_id)
            .eq('numero_control_alumno', numero_control_alumno)
            .maybeSingle();

        if (previaError) throw previaError;
        if (previa) {
            return res.status(409).json({
                error: 'Ya estás inscrito en esta asesoría.',
                codigo: 'YA_INSCRITO',
            });
        }

        // c) Validar el cupo.
        const { count, error: countError } = await supabase
            .from('inscripciones_asesorias')
            .select('*', { count: 'exact', head: true })
            .eq('asesoria_id', asesoria_id);

        if (countError) throw countError;
        if (count >= asesoria.cupo_maximo) {
            return res.status(409).json({
                error: 'Esta asesoría ya no tiene lugares disponibles.',
                codigo: 'CUPO_LLENO',
            });
        }

        // d) Insertar. El UNIQUE(asesoria_id, numero_control_alumno) cubre el caso de dos clics simultáneos.
        const { error } = await supabase
            .from('inscripciones_asesorias')
            .insert([{ asesoria_id, numero_control_alumno, nombre_alumno }]);

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({
                    error: 'Ya estás inscrito en esta asesoría.',
                    codigo: 'YA_INSCRITO',
                });
            }
            throw error;
        }

        res.status(201).json({ message: 'Inscripción exitosa' });
    } catch (error) {
        console.error('Error al inscribir:', error.message);
        res.status(500).json({ error: 'No se pudo completar la inscripción' });
    }
};

module.exports = { getAsesorias, createAsesoria, inscribirAsesoria };