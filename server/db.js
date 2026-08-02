require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  database: process.env.DB_NAME || "hidrocampo",
  user: process.env.DB_USER || "hidrocampo_app",
  password: process.env.DB_PASSWORD || "CAMBIA_ESTA_CLAVE_123!",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verifica la conexion (lanza si falla); mysql2 ya maneja el pool internamente,
// esto solo confirma que las credenciales/host son correctos antes de usarlo.
async function getPool() {
  await pool.query("SELECT 1");
  return pool;
}

module.exports = { pool, getPool };
