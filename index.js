require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // <-- Nuevo

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración estricta de CORS para permitir cookies
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Puerto por defecto de Vite (React)
    credentials: true // <-- Vital para que acepte cookies
}));
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser()); 

const authRoutes = require('./src/routes/auth');
const studentRoutes = require('./src/routes/student');
const extraRoutes = require('./src/routes/extra'); 

app.use('/api/local', authRoutes);
app.use('/api/local', studentRoutes);
app.use('/api/local/asesorias', extraRoutes);

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
}
module.exports = app;
app.use(express.json());
app.use(cookieParser()); // <-- Activar lectura de cookies

const authRoutes = require('./src/routes/auth');
const studentRoutes = require('./src/routes/student');
const extraRoutes = require('./src/routes/extra'); 

app.use('/api/local', authRoutes);
app.use('/api/local', studentRoutes);
app.use('/api/local/asesorias', extraRoutes);

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});