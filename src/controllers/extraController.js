const supabase = require('../config/supabase');

// 1. Obtener todas las asesorías activas
const getAsesorias = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('asesorias')
            .select('*')
            .order('fecha_hora', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener asesorías:", error.message);
        res.status(500).json({ error: "No se pudieron obtener las asesorías" });
    }
};

// 2. Crear una nueva asesoría (como tutor)
const createAsesoria = async (req, res) => {
    const { numero_control_tutor, nombre_tutor, materia_asesoria, descripcion_tema, ubicacion, fecha_hora, cupo_maximo } = req.body;

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
                cupo_maximo: cupo_maximo || 5
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: "Asesoría publicada con éxito", data: data[0] });
    } catch (error) {
        console.error("Error al crear asesoría:", error.message);
        res.status(500).json({ error: "No se pudo crear la asesoría" });
    }
};

// 3. Inscribir a un alumno en una asesoría
const inscribirAsesoria = async (req, res) => {
    const { asesoria_id, numero_control_alumno, nombre_alumno } = req.body;

    try {
        const { data, error } = await supabase
            .from('inscripciones_asesorias')
            .insert([{
                asesoria_id,
                numero_control_alumno,
                nombre_alumno
            }]);

        if (error) {
            // Error 23505 en PostgreSQL significa violación de unicidad (ya inscrito)
            if (error.code === '23505') {
                return res.status(409).json({ error: "El alumno ya está inscrito en esta asesoría" });
            }
            throw error;
        }

        res.status(201).json({ message: "Inscripción exitosa" });
    } catch (error) {
        console.error("Error al inscribir:", error.message);
        res.status(500).json({ error: "No se pudo completar la inscripción" });
    }
};

module.exports = { getAsesorias, createAsesoria, inscribirAsesoria };