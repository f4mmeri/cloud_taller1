const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 8000;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// DB
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error al abrir la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )`);
  }
});

// ---------- RUTAS /users ----------

// GET /users - lista
app.get("/users", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// HEAD /users - solo headers (Express mapea HEAD a GET, pero lo dejamos explícito)
app.head("/users", (req, res) => {
  db.get("SELECT COUNT(*) as c FROM users", [], (err, row) => {
    if (err) return res.sendStatus(500);
    res.setHeader("X-Total-Count", row.c);
    res.sendStatus(200);
  });
});

// OPTIONS /users - métodos permitidos
app.options("/users", (req, res) => {
  res.setHeader("Allow", "GET,POST,HEAD,OPTIONS");
  res.sendStatus(204);
});

// POST /users - crear
app.post("/users", (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: "name y email son requeridos" });
  }
  db.run(
    `INSERT INTO users (name, email) VALUES (?, ?)`,
    [name, email],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, name, email });
    }
  );
});

// ---------- RUTAS /users/:id ----------

// GET /users/:id - detalle
app.get("/users/:id", (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Usuario no encontrado" });
    res.status(200).json(row);
  });
});

// HEAD /users/:id - solo headers si existe
app.head("/users/:id", (req, res) => {
  db.get("SELECT id FROM users WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.sendStatus(500);
    if (!row) return res.sendStatus(404);
    res.sendStatus(200);
  });
});

// OPTIONS /users/:id - métodos permitidos
app.options("/users/:id", (req, res) => {
  res.setHeader("Allow", "GET,PUT,PATCH,DELETE,HEAD,OPTIONS");
  res.sendStatus(204);
});

// PUT /users/:id - reemplazo completo
app.put("/users/:id", (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: "name y email son requeridos" });
  }
  db.run(
    `UPDATE users SET name = ?, email = ? WHERE id = ?`,
    [name, email, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Usuario no encontrado" });
      res.status(200).json({ id: Number(req.params.id), name, email });
    }
  );
});

// PATCH /users/:id - actualización parcial
app.patch("/users/:id", (req, res) => {
  const fields = [];
  const values = [];
  ["name", "email"].forEach((k) => {
    if (req.body && req.body[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(req.body[k]);
    }
  });
  if (fields.length === 0) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }
  values.push(req.params.id);
  db.run(
    `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
    values,
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Usuario no encontrado" });
      // Devuelve el recurso actualizado
      db.get(
        "SELECT * FROM users WHERE id = ?",
        [req.params.id],
        (e2, row) => {
          if (e2) return res.status(500).json({ error: e2.message });
          res.status(200).json(row);
        }
      );
    }
  );
});

// DELETE /users/:id - borrar
app.delete("/users/:id", (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.sendStatus(204); // No Content
  });
});

// 404 para cualquier otra ruta
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Server
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
