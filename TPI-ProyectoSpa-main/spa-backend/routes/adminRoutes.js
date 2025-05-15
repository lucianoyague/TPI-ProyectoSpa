const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');
const verifyToken = require('../middleware/verifyToken');
const { sendInvitationCode } = require('../utils/mailer');
const router = express.Router();

const SECRET_KEY = process.env.SECRET_KEY || 'tu_clave_secreta';
const INVITATION_CODE = process.env.INVITATION_CODE || 'ADMIN123';

// Ruta para generar y enviar un código de invitación
router.post('/generate-and-send-code', verifyToken, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'El correo electrónico es obligatorio' });
    }

    try {
        // Generar un código único
        const codigo = crypto.randomBytes(16).toString('hex');
        console.log(`Código generado: ${codigo}`); // 🚀 Verificación

        // Insertar el código en la base de datos
        const [result] = await db.query('INSERT INTO codigo_invitacion (codigo, usado) VALUES (?, ?)', [codigo, 0]);
        console.log(`Resultado de la inserción en la BD:`, result); // 🚀 Confirmación

        if (result.affectedRows === 0) {
            throw new Error('Error al insertar el código en la base de datos');
        }

        // Enviar el código por correo
        await sendInvitationCode(email, codigo);
        console.log(`Correo enviado a ${email}`); // 🚀 Confirmación del envío

        res.status(200).json({ message: 'Código generado y enviado exitosamente' });
    } catch (err) {
        console.error('Error al generar y enviar el código:', err);
        res.status(500).json({ error: 'Error al generar y enviar el código' });
    }
});

// Ruta para registrar un nuevo administrador
router.post('/register', async (req, res) => {
    const { nombre, apellido, email, telefono, contraseña, codigoInvitacion } = req.body;

    if (!nombre || !apellido || !email || !telefono || !contraseña || !codigoInvitacion) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        // Verificar si el código existe y no ha sido usado
        const [rows] = await db.query('SELECT * FROM codigo_invitacion WHERE codigo = ? AND usado = FALSE', [codigoInvitacion]);
        if (rows.length === 0) {
            return res.status(403).json({ error: 'Código de invitación inválido o ya usado' });
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(contraseña, 10);

        // Insertar el administrador en la base de datos
        const [result] = await db.query(
            'INSERT INTO administrador (nombre, apellido, email, telefono, contraseña) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellido, email, telefono, hashedPassword]
        );

        // Marcar el código como usado
        await db.query('UPDATE codigo_invitacion SET usado = TRUE WHERE codigo = ?', [codigoInvitacion]);

        // Generar un token JWT
        const token = jwt.sign(
            { id: result.insertId, email },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.status(201).json({ message: 'Administrador registrado exitosamente', token });
    } catch (err) {
        console.error('Error al registrar el administrador:', err);
        res.status(500).json({ error: 'Error al registrar el administrador' });
    }
});

// Inicio de sesión de administradores
router.post('/login', async (req, res) => {
    console.log('Datos recibidos en /api/admin/login:', req.body); // Log para depuración
    const { email, contraseña } = req.body;

    if (!email || !contraseña) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        // Buscar al administrador por email
        const [rows] = await db.query('SELECT * FROM administrador WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        const admin = rows[0];

        // Verificar la contraseña
        const contraseñaValida = await bcrypt.compare(contraseña, admin.contraseña);
        if (!contraseñaValida) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        // Generar un token
        const token = jwt.sign(
            { id: admin.id_admin, email: admin.email },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({ message: 'Inicio de sesión exitoso', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }

// Ruta protegida
router.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'Acceso permitido', admin: req.admin });
});
});

module.exports = router;