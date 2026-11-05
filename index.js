require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
// Render inyecta su propio puerto dinámico aquí
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

// Arranque directo, incondicional y expuesto a todas las interfaces (0.0.0.0) para Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});