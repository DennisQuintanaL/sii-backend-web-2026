const axios = require('axios');

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email y password son requeridos" });
    }
    try {
        const response = await axios.post(`${process.env.SII_BASE_URL}/login`, { email, password });

        if (response.data && response.data.message && response.data.message.login) {
            const token = response.data.message.login.token;
            
            // Inyectamos la cookie HTTP-Only
            res.cookie('sii_token', token, {
                httpOnly: true, // Invisible para JavaScript en el frontend
                secure: process.env.NODE_ENV === 'production', // true en Vercel (HTTPS)
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 1000 * 60 * 60 * 2 // Expira en 2 horas
            });

            // Respondemos éxito, pero SIN el token
            return res.status(200).json({ message: "Autenticación exitosa", rol: "estudiante" });
        } else {
            throw new Error("Estructura de respuesta del SII inesperada");
        }
    } catch (error) {
        console.error("Error al autenticar con SII:", error.message);
        // Si el servidor del SII responde con un 401 u otro error
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ error: "Credenciales inválidas o falla en el servicio institucional" });
    }
};

module.exports = { login };