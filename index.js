const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 8000;

// Middleware para parsear JSON
app.use(express.json());

// Conectar a la base de datos SQLite (se creará si no existe)
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error al abrir la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");
    // Crear tabla si no existe
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT
    )`);
  }
});

// Rutas
// Obtener todos los usuarios
app.get("/users", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Agregar un usuario
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  db.run(`INSERT INTO users (name, email) VALUES (?, ?)`,
    [name, email],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, email });
    }
  );
});

// Obtener un usuario por id
app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
