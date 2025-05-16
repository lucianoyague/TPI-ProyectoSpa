const mysql = require('mysql2/promise'); // Cambiar a mysql2/promise
const dotenv = require('dotenv');

// Configurar variables de entorno
dotenv.config();

// Crear conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
// Probar la conexión
(async () => {
    try {
        const connection = await pool.getConnection(); // Usar await para obtener la conexión
        console.log('Conexión exitosa a la base de datos');
        connection.release(); // Liberar la conexión
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
    }
})();

module.exports = pool;
