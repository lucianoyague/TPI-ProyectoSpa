const express = require('express');
const db = require('../db');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Validaciones comunes
const servicioValidations = [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('duracion').isInt({ min: 1 }).withMessage('Duración debe ser un número positivo'),
    body('precio').isFloat({ min: 0 }).withMessage('Precio debe ser un número positivo'),
    body('categoria').isIn(['Masajes', 'Belleza', 'Tratamientos Faciales', 'Tratamientos Corporales', 'Servicios Grupales'])
        .withMessage('Categoría no válida')
];

// Obtener todos los servicios
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM servicio ORDER BY categoria, nombre');
        const servicios = rows.map(servicio => ({
            ...servicio,
            precio: parseFloat(servicio.precio) || 0.00,
            duracion: parseInt(servicio.duracion) || 0
        }));
        res.json(servicios);
    } catch (err) {
        console.error('Error al obtener los servicios:', err);
        res.status(500).json({ 
            error: 'Error al obtener los servicios',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Obtener un servicio por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM servicio WHERE id_servicio = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'El servicio no existe.' });
        }
        
        const servicio = {
            ...rows[0],
            precio: parseFloat(rows[0].precio),
            duracion: parseInt(rows[0].duracion)
        };
        
        res.json(servicio);
    } catch (err) {
        console.error('Error al obtener el servicio:', err);
        res.status(500).json({ 
            error: 'Error al obtener el servicio',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Crear un nuevo servicio
router.post('/', servicioValidations, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, descripcion, duracion, precio, categoria } = req.body;

    try {
        // Validación adicional para servicios grupales
        if (categoria === 'Servicios Grupales') {
            const [existente] = await db.query(
                'SELECT * FROM servicio WHERE nombre = ? AND categoria = ?', 
                [nombre, categoria]
            );
            
            if (existente.length > 0) {
                return res.status(400).json({ 
                    error: 'Ya existe un servicio grupal con este nombre' 
                });
            }
        }

        const [result] = await db.query(
            'INSERT INTO servicio (nombre, descripcion, duracion, precio, categoria) VALUES (?, ?, ?, ?, ?)',
            [nombre, descripcion || null, duracion, precio, categoria]
        );

        // Obtener el servicio recién creado para devolverlo
        const [newService] = await db.query(
            'SELECT * FROM servicio WHERE id_servicio = ?',
            [result.insertId]
        );

        res.status(201).json({ 
            message: 'Servicio creado exitosamente',
            servicio: {
                ...newService[0],
                precio: parseFloat(newService[0].precio),
                duracion: parseInt(newService[0].duracion)
            }
        });
    } catch (err) {
        console.error('Error al crear el servicio:', err);
        res.status(500).json({ 
            error: 'Error al crear el servicio',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Actualizar un servicio
router.put('/:id', servicioValidations, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre, descripcion, duracion, precio, categoria } = req.body;

    try {
        // Verificar que el servicio existe
        const [existing] = await db.query(
            'SELECT * FROM servicio WHERE id_servicio = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'El servicio no existe.' });
        }

        // Validación para servicios grupales
        if (categoria === 'Servicios Grupales' && nombre !== existing[0].nombre) {
            const [conflict] = await db.query(
                'SELECT * FROM servicio WHERE nombre = ? AND categoria = ? AND id_servicio != ?',
                [nombre, categoria, id]
            );
            
            if (conflict.length > 0) {
                return res.status(400).json({ 
                    error: 'Ya existe un servicio grupal con este nombre' 
                });
            }
        }

        const [result] = await db.query(
            'UPDATE servicio SET nombre = ?, descripcion = ?, duracion = ?, precio = ?, categoria = ? WHERE id_servicio = ?',
            [nombre, descripcion || null, duracion, precio, categoria, id]
        );

        // Obtener el servicio actualizado
        const [updatedService] = await db.query(
            'SELECT * FROM servicio WHERE id_servicio = ?',
            [id]
        );

        res.json({ 
            message: 'Servicio actualizado exitosamente',
            servicio: {
                ...updatedService[0],
                precio: parseFloat(updatedService[0].precio),
                duracion: parseInt(updatedService[0].duracion)
            }
        });
    } catch (err) {
        console.error('Error al actualizar el servicio:', err);
        res.status(500).json({ 
            error: 'Error al actualizar el servicio',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Eliminar un servicio
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar que el servicio existe
        const [existing] = await db.query(
            'SELECT * FROM servicio WHERE id_servicio = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'El servicio no existe.' });
        }

        // Verificar si tiene turnos asociados
        const [turnosAsociados] = await db.query(
            'SELECT COUNT(*) AS count FROM turno_servicio WHERE id_servicio = ?',
            [id]
        );
        
        if (turnosAsociados[0].count > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar el servicio porque tiene turnos asociados' 
            });
        }

        await db.query('DELETE FROM servicio WHERE id_servicio = ?', [id]);
        
        res.json({ 
            message: 'Servicio eliminado exitosamente',
            servicioEliminado: {
                ...existing[0],
                precio: parseFloat(existing[0].precio),
                duracion: parseInt(existing[0].duracion)
            }
        });
    } catch (err) {
        console.error('Error al eliminar el servicio:', err);
        res.status(500).json({ 
            error: 'Error al eliminar el servicio',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = router;