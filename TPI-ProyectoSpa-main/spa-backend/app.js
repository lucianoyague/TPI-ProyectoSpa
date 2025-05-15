const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importar CORS
const crypto = require('crypto');
const db = require('./db');
const { sendInvitationCode } = require('./utils/mailer');
const adminRoutes = require('./routes/adminRoutes');
const turnoRoutes = require('./routes/turnoRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const comboRoutes = require('./routes/comboRoutes');

const app = express();

// Middleware
app.use(cors()); // Habilitar CORS para todas las solicitudes
app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(`Solicitud entrante: ${req.method} ${req.url}`);
    next();
});

// Registrar las rutas
app.use('/api/admin', adminRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/combos', comboRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejar rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Función para generar el código inicial
const generateInitialCode = async () => {
    try {
        const [rows] = await db.query('SELECT COUNT(*) AS count FROM administrador');
        if (rows[0].count === 0) {
            const codigo = crypto.randomBytes(16).toString('hex');
            await db.query('INSERT INTO codigo_invitacion (codigo) VALUES (?)', [codigo]);

            const email = process.env.INITIAL_ADMIN_EMAIL;
            if (email) {
                await sendInvitationCode(email, codigo);
                console.log('No hay administradores registrados.');
                console.log(`Código inicial enviado a: ${email}`);
            } else {
                console.log('No hay administradores registrados.');
                console.log('No se configuró un correo para el administrador inicial.');
            }
        }
    } catch (err) {
        console.error('Error al verificar o generar el código inicial:', err);
    }
};

// Llamar a la función para generar el código inicial
generateInitialCode();