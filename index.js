require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración estricta de CORS para permitir cookies
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser()); 

// Importación de rutas
const authRoutes = require('./src/routes/auth');
const studentRoutes = require('./src/routes/student');
const extraRoutes = require('./src/routes/extra'); 

// Registro de endpoints
app.use('/api/local', authRoutes);
app.use('/api/local', studentRoutes);
app.use('/api/local/asesorias', extraRoutes);

// Control de arranque para desarrollo local vs Vercel (Serverless)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
}

// Exportación obligatoria para Vercel
module.exports = app;