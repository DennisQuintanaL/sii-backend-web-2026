const extractToken = (req, res, next) => {
    // Leemos la cookie generada en el login
    const token = req.cookies.sii_token;
    
    if (!token) {
        return res.status(401).json({ error: "Acceso denegado. No hay sesión activa." });
    }

    // Lo guardamos en la request para que los controladores lo usen
    req.token = token;
    next();
};

module.exports = { extractToken };