const db = require('./db');

db.query('SELECT 1 + 1 AS result')
    .then(([rows]) => {
        console.log('Conexión exitosa:', rows);
    })
    .catch((err) => {
        console.error('Error al conectar a la base de datos:', err);
    });