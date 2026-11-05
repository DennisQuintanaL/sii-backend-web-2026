const axios = require('axios');

// Helper para generar los headers que requiere el SII
const getSiiConfig = (token) => ({
    headers: { Authorization: `Bearer ${token}` }
});

const getPerfil = async (req, res) => {
    try {
        const response = await axios.get(`${process.env.SII_BASE_URL}/movil/estudiante`, getSiiConfig(req.token));
        
        // Devolvemos directamente el objeto "data", descartando banderas innecesarias
        res.status(200).json(response.data.data);
    } catch (error) {
        console.error("Error en perfil:", error.message);
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ error: "Token inválido o error al obtener el perfil" });
    }
};

const getCalificaciones = async (req, res) => {
    try {
        const response = await axios.get(`${process.env.SII_BASE_URL}/movil/estudiante/calificaciones`, getSiiConfig(req.token));
        
        // La API devuelve un arreglo con los periodos. El índice 0 es el actual.
        // Extraemos directamente las materias para facilitarle el trabajo a React.
        const materias = response.data.data[0].materias;
        res.status(200).json(materias);
    } catch (error) {
        console.error("Error en calificaciones:", error.message);
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ error: "Error al obtener calificaciones" });
    }
};

module.exports = { getPerfil, getCalificaciones };

const getKardex = async (req, res) => {
    try {
        const response = await axios.get(`${process.env.SII_BASE_URL}/movil/estudiante/kardex`, getSiiConfig(req.token));
        
        // Devolvemos el avance y el arreglo del kardex limpio
        res.status(200).json(response.data.data);
    } catch (error) {
        console.error("Error en kardex:", error.message);
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ error: "Error al obtener el kardex" });
    }
};

const getHorarios = async (req, res) => {
    try {
        const response = await axios.get(`${process.env.SII_BASE_URL}/movil/estudiante/horarios`, getSiiConfig(req.token));
        
        // La API devuelve un arreglo con el periodo en el índice 0. Extraemos directamente el horario.
        const horario = response.data.data[0].horario;
        res.status(200).json(horario);
    } catch (error) {
        console.error("Error en horarios:", error.message);
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ error: "Error al obtener los horarios" });
    }
};

// No olvides actualizar las exportaciones al final
module.exports = { getPerfil, getCalificaciones, getKardex, getHorarios };