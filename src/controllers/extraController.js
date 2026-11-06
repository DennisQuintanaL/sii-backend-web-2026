const supabase = require('../config/supabase');

// true si `valor` es una fecha válida posterior al momento actual.
const esFechaFutura = (valor) => {
    const t = new Date(valor).getTime();
    return !Number.isNaN(t) && t > Date.now();
};

// 1. GET /api/local/asesorias
//    Solo asesorías que aún no han ocurrido (fecha_hora >= ahora), con inscritos y cupo_disponible calculados.
const getAsesorias = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('asesorias')
            .select('*, inscripciones_asesorias(count)')
            .gte('fecha_hora', new Date().toISOString())
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

    if (!esFechaFutura(fecha_hora)) {
        return res.status(400).json({ error: 'fecha_hora debe ser una fecha válida que aún no haya pasado.' });
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
//      409 con codigo YA_INSCRITO, CUPO_LLENO o ASESORIA_PASADA | 500 error interno
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
            .select('id, cupo_maximo, fecha_hora')
            .eq('id', asesoria_id)
            .maybeSingle();

        if (asesoriaError) throw asesoriaError;
        if (!asesoria) {
            return res.status(404).json({ error: 'La asesoría no existe.' });
        }
        if (!esFechaFutura(asesoria.fecha_hora)) {
            return res.status(409).json({
                error: 'Esta asesoría ya ocurrió.',
                codigo: 'ASESORIA_PASADA',
            });
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

// 4. PUT /api/local/asesorias/:id
//    Edita una asesoría. Solo su tutor puede hacerlo.
//    Body: numero_control_tutor (quién lo pide) + los campos a cambiar (todos opcionales):
//          materia_asesoria, descripcion_tema, ubicacion, fecha_hora, cupo_maximo.
//    Respuestas: 200 | 400 datos inválidos | 403 no es el tutor | 404 no existe
//                409 ya ocurrió, o cupo menor a los inscritos | 500
const CAMPOS_EDITABLES = ['materia_asesoria', 'descripcion_tema', 'ubicacion', 'fecha_hora', 'cupo_maximo'];

const updateAsesoria = async (req, res) => {
    const { id } = req.params;
    const { numero_control_tutor } = req.body;

    if (!numero_control_tutor) {
        return res.status(400).json({ error: 'Falta numero_control_tutor.' });
    }

    try {
        const { data: asesoria, error: asesoriaError } = await supabase
            .from('asesorias')
            .select('id, numero_control_tutor, fecha_hora')
            .eq('id', id)
            .maybeSingle();

        if (asesoriaError) throw asesoriaError;
        if (!asesoria) {
            return res.status(404).json({ error: 'La asesoría no existe.' });
        }
        if (String(asesoria.numero_control_tutor) !== String(numero_control_tutor)) {
            return res.status(403).json({ error: 'Solo el tutor puede modificar esta asesoría.' });
        }
        if (!esFechaFutura(asesoria.fecha_hora)) {
            return res.status(409).json({ error: 'Esta asesoría ya ocurrió y no se puede modificar.' });
        }

        // Solo se toman los campos permitidos que vengan con valor.
        const cambios = {};
        for (const campo of CAMPOS_EDITABLES) {
            const valor = req.body[campo];
            if (valor === undefined || valor === null) continue;
            cambios[campo] = typeof valor === 'string' ? valor.trim() : valor;
        }

        for (const campo of ['materia_asesoria', 'descripcion_tema', 'ubicacion']) {
            if (campo in cambios && !cambios[campo]) {
                return res.status(400).json({ error: `${campo} no puede estar vacío.` });
            }
        }
        if ('fecha_hora' in cambios && !esFechaFutura(cambios.fecha_hora)) {
            return res.status(400).json({ error: 'fecha_hora debe ser una fecha válida que aún no haya pasado.' });
        }
        if ('cupo_maximo' in cambios) {
            const cupo = Number(cambios.cupo_maximo);
            if (!Number.isInteger(cupo) || cupo < 1) {
                return res.status(400).json({ error: 'cupo_maximo debe ser un entero mayor o igual a 1.' });
            }
            cambios.cupo_maximo = cupo;

            // No se puede dejar el cupo por debajo de los alumnos ya inscritos.
            const { count, error: countError } = await supabase
                .from('inscripciones_asesorias')
                .select('*', { count: 'exact', head: true })
                .eq('asesoria_id', id);

            if (countError) throw countError;
            if (cupo < count) {
                return res.status(409).json({
                    error: `No puedes bajar el cupo a menos de los ${count} alumnos ya inscritos.`,
                    codigo: 'CUPO_MENOR_A_INSCRITOS',
                });
            }
        }

        if (Object.keys(cambios).length === 0) {
            return res.status(400).json({ error: 'No hay cambios que guardar.' });
        }

        const { data, error } = await supabase
            .from('asesorias')
            .update(cambios)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.status(200).json({ message: 'Asesoría actualizada', data: data[0] });
    } catch (error) {
        console.error('Error al actualizar asesoría:', error.message);
        res.status(500).json({ error: 'No se pudo actualizar la asesoría' });
    }
};

// 5. DELETE /api/local/asesorias/:id?numero_control_tutor=...
//    Elimina una asesoría y sus inscripciones. Solo su tutor puede hacerlo.
//    Respuestas: 200 | 400 falta numero_control_tutor | 403 no es el tutor | 404 no existe | 500
const deleteAsesoria = async (req, res) => {
    const { id } = req.params;
    const numero_control_tutor = req.query.numero_control_tutor || req.body?.numero_control_tutor;

    if (!numero_control_tutor) {
        return res.status(400).json({ error: 'Falta numero_control_tutor.' });
    }

    try {
        const { data: asesoria, error: asesoriaError } = await supabase
            .from('asesorias')
            .select('id, numero_control_tutor')
            .eq('id', id)
            .maybeSingle();

        if (asesoriaError) throw asesoriaError;
        if (!asesoria) {
            return res.status(404).json({ error: 'La asesoría no existe.' });
        }
        if (String(asesoria.numero_control_tutor) !== String(numero_control_tutor)) {
            return res.status(403).json({ error: 'Solo el tutor puede eliminar esta asesoría.' });
        }

        // Primero las inscripciones (si la llave foránea no tiene ON DELETE CASCADE, evita el error).
        const { error: insError } = await supabase
            .from('inscripciones_asesorias')
            .delete()
            .eq('asesoria_id', id);
        if (insError) throw insError;

        const { error } = await supabase
            .from('asesorias')
            .delete()
            .eq('id', id);
        if (error) throw error;

        res.status(200).json({ message: 'Asesoría eliminada' });
    } catch (error) {
        console.error('Error al eliminar asesoría:', error.message);
        res.status(500).json({ error: 'No se pudo eliminar la asesoría' });
    }
};

module.exports = { getAsesorias, createAsesoria, inscribirAsesoria, updateAsesoria, deleteAsesoria };