const express = require('express');
const db = require('../db');
const router = express.Router();

// Ruta para registrar un turno y un cliente
router.post('/reservas', async (req, res) => {
    console.log('Solicitud recibida en /reservas:', req.body); // Agregar este log
    const { cliente, turno } = req.body;

    if (!cliente || !turno) {
        return res.status(400).json({ error: 'Los datos del cliente y del turno son obligatorios' });
    }

    const connection = await db.getConnection(); // Obtener conexión para transacciones
    try {
        await connection.beginTransaction(); // Iniciar transacción

        // Insertar cliente
        const [clienteResult] = await connection.query(
            'INSERT INTO cliente (nombre, apellido, telefono, nacionalidad, dni, email, comentario) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                cliente.nombre,
                cliente.apellido,
                cliente.telefono,
                cliente.nacionalidad,
                cliente.dni,
                cliente.email,
                cliente.comentario || null,
            ]
        );

        const clienteId = clienteResult.insertId;

        // Insertar turno
        const [turnoResult] = await connection.query(
            'INSERT INTO turno (id_cliente, fecha, hora, duracion_total, precio_total, metodo_pago, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                clienteId,
                turno.fecha,
                turno.hora,
                turno.duracionTotal,
                turno.precioTotal,
                turno.metodoPago,
                'pendiente', // Estado inicial del turno
            ]
        );

        const turnoId = turnoResult.insertId;

        // Insertar servicios relacionados con el turno
        for (const servicio of turno.servicios) {
            // Validar que el servicio exista en la tabla servicio
            const [servicioExists] = await connection.query(
                'SELECT COUNT(*) AS count FROM servicio WHERE id_servicio = ?',
                [servicio]
            );

            if (servicioExists[0].count === 0) {
                throw new Error(`El servicio con id ${servicio} no existe en la tabla servicio`);
            }

            await connection.query(
                'INSERT INTO turno_servicio (id_turno, id_servicio) VALUES (?, ?)',
                [turnoId, servicio]
            );
        }

        await connection.commit(); // Confirmar transacción
        res.status(201).json({ message: 'Reserva registrada exitosamente' });
    } catch (err) {
        await connection.rollback(); // Revertir transacción en caso de error
        console.error('Error al registrar la reserva:', err);
        res.status(500).json({ error: 'Error al registrar la reserva' });
    } finally {
        connection.release(); // Liberar conexión
    }
});

module.exports = router;