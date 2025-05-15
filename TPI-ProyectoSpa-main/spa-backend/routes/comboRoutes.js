const express = require('express');
const db = require('../db');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Validaciones para los combos
const comboValidations = [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('descripcion').trim().notEmpty().withMessage('La descripción es requerida'),
    body('precio_total').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
    body('servicios').isArray().withMessage('Debe incluir una lista de servicios'),
    body('servicios.*').isInt().withMessage('Cada servicio debe tener un ID válido')
];

// Obtener todos los combos y sus servicios asociados
router.get('/', async (req, res) => {
    try {
        const [combos] = await db.query('SELECT * FROM combo');
        const comboData = await Promise.all(combos.map(async (combo) => {
            const [servicios] = await db.query(
                'SELECT s.* FROM combo_servicio cs JOIN servicio s ON cs.id_servicio = s.id_servicio WHERE cs.id_combo = ?',
                [combo.id_combo]
            );
            return { ...combo, servicios };
        }));
        res.json(comboData);
    } catch (err) {
        console.error('Error al obtener los combos:', err);
        res.status(500).json({ error: 'Error al obtener los combos' });
    }
});

// Obtener un combo por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [combo] = await db.query('SELECT * FROM combo WHERE id_combo = ?', [id]);
        if (combo.length === 0) {
            return res.status(404).json({ error: 'El combo no existe.' });
        }

        const [servicios] = await db.query(
            'SELECT s.* FROM combo_servicio cs JOIN servicio s ON cs.id_servicio = s.id_servicio WHERE cs.id_combo = ?',
            [id]
        );

        res.json({ ...combo[0], servicios });
    } catch (err) {
        console.error('Error al obtener el combo:', err);
        res.status(500).json({ error: 'Error al obtener el combo' });
    }
});

// Crear un nuevo combo
router.post('/', comboValidations, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, descripcion, precio_total, servicios } = req.body;

    try {
        // Insertar el nuevo combo en la tabla
        const [result] = await db.query(
            'INSERT INTO combo (nombre, descripcion, precio_total) VALUES (?, ?, ?)',
            [nombre, descripcion, precio_total]
        );
        const comboId = result.insertId;

        // Asociar servicios al combo
        for (const servicioId of servicios) {
            if (!servicioId || isNaN(servicioId)) {
                throw new Error(`ID de servicio inválido: ${servicioId}`);
            }
            await db.query(
                'INSERT INTO combo_servicio (id_combo, id_servicio) VALUES (?, ?)',
                [comboId, servicioId]
            );
        }

        res.status(201).json({ message: 'Combo creado exitosamente', id_combo: comboId });
    } catch (err) {
        console.error('Error al crear el combo:', err);
        res.status(500).json({ error: 'Error al crear el combo' });
    }
});

// Modificar un combo existente
router.put('/:id', comboValidations, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre, descripcion, precio_total, servicios } = req.body;

    try {
        // Verificar que el combo existe
        const [existing] = await db.query('SELECT * FROM combo WHERE id_combo = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'El combo no existe.' });
        }

        // Actualizar datos del combo
        await db.query(
            'UPDATE combo SET nombre = ?, descripcion = ?, precio_total = ? WHERE id_combo = ?',
            [nombre, descripcion, precio_total, id]
        );

        // Actualizar los servicios del combo
        await db.query('DELETE FROM combo_servicio WHERE id_combo = ?', [id]); // Eliminar los servicios actuales
        for (const servicioId of servicios) {
            await db.query(
                'INSERT INTO combo_servicio (id_combo, id_servicio) VALUES (?, ?)',
                [id, servicioId]
            );
        }

        res.json({ message: 'Combo actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar el combo:', err);
        res.status(500).json({ error: 'Error al actualizar el combo' });
    }
});

// Eliminar un combo
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar si el combo existe
        const [existing] = await db.query('SELECT * FROM combo WHERE id_combo = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'El combo no existe.' });
        }

        // Eliminar asociaciones con servicios
        await db.query('DELETE FROM combo_servicio WHERE id_combo = ?', [id]);

        // Eliminar el combo
        await db.query('DELETE FROM combo WHERE id_combo = ?', [id]);

        res.json({ message: 'Combo eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar el combo:', err);
        res.status(500).json({ error: 'Error al eliminar el combo' });
    }
});

module.exports = router;