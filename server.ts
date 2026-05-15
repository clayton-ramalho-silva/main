import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("nexus.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS integrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    port INTEGER NOT NULL,
    protocol TEXT NOT NULL,
    access_type TEXT NOT NULL,
    tls_version TEXT,
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    integration_id INTEGER,
    ip TEXT,
    geo TEXT,
    method TEXT,
    status INTEGER,
    auth_status TEXT,
    tls_version TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(integration_id) REFERENCES integrations(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    threshold INTEGER,
    active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Insert default admin if not exists
  INSERT OR IGNORE INTO users (username, password, name, role) 
  VALUES ('admin', 'admin123', 'Administrador Nexus', 'admin');
`);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- API Routes ---

  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id, username, name, role FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  });

  // Users CRUD
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, name, role, created_at FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, name, role } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO users (username, password, name, role)
        VALUES (?, ?, ?, ?)
      `).run(username, password || 'nexus123', name, role || 'client');
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { username, password, name, role } = req.body;
    if (password) {
      db.prepare(`
        UPDATE users SET username = ?, password = ?, name = ?, role = ? WHERE id = ?
      `).run(username, password, name, role, req.params.id);
    } else {
      db.prepare(`
        UPDATE users SET username = ?, name = ?, role = ? WHERE id = ?
      `).run(username, name, role, req.params.id);
    }
    res.json({ success: true });
  });

  app.delete("/api/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Integrations CRUD
  app.get("/api/integrations", (req, res) => {
    const integrations = db.prepare("SELECT * FROM integrations").all();
    res.json(integrations);
  });

  app.post("/api/integrations", (req, res) => {
    const { name, origin, destination, port, protocol, access_type, tls_version, observations } = req.body;
    const info = db.prepare(`
      INSERT INTO integrations (name, origin, destination, port, protocol, access_type, tls_version, observations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, origin, destination, port, protocol, access_type, tls_version, observations);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/integrations/:id", (req, res) => {
    const { name, origin, destination, port, protocol, access_type, tls_version, observations } = req.body;
    db.prepare(`
      UPDATE integrations 
      SET name = ?, origin = ?, destination = ?, port = ?, protocol = ?, access_type = ?, tls_version = ?, observations = ?
      WHERE id = ?
    `).run(name, origin, destination, port, protocol, access_type, tls_version, observations, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/integrations/:id", (req, res) => {
    db.prepare("DELETE FROM integrations WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Logs
  app.get("/api/logs", (req, res) => {
    const logs = db.prepare(`
      SELECT l.*, i.name as integration_name 
      FROM logs l 
      LEFT JOIN integrations i ON l.integration_id = i.id 
      ORDER BY timestamp DESC LIMIT 100
    `).all();
    res.json(logs);
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const integrationId = req.query.integrationId;
    const whereClause = integrationId ? "WHERE integration_id = ?" : "";
    const params = integrationId ? [integrationId] : [];

    const volume = db.prepare(`SELECT count(*) as count FROM logs ${whereClause}`).get(...params) as any;
    const errors = db.prepare(`SELECT count(*) as count FROM logs ${integrationId ? whereClause + " AND" : "WHERE"} status >= 400`).get(...params) as any;
    const authFailures = db.prepare(`SELECT count(*) as count FROM logs ${integrationId ? whereClause + " AND" : "WHERE"} auth_status = 'failed'`).get(...params) as any;
    
    const methods = db.prepare(`SELECT method, count(*) as count FROM logs ${whereClause} GROUP BY method`).all(...params);
    const timeline = db.prepare(`
      SELECT strftime('%H:00', timestamp) as hour, count(*) as count 
      FROM logs 
      WHERE timestamp > datetime('now', '-24 hours')
      ${integrationId ? "AND integration_id = ?" : ""}
      GROUP BY hour
    `).all(...params);

    res.json({
      summary: {
        totalVolume: volume.count,
        errorRate: volume.count > 0 ? ((errors.count / volume.count) * 100).toFixed(1) : 0,
        authFailures: authFailures.count,
      },
      methods,
      timeline
    });
  });

  // Simulation
  app.post("/api/simulate", (req, res) => {
    const integrations = db.prepare("SELECT id FROM integrations").all() as any[];
    if (integrations.length === 0) return res.status(400).json({ error: "Create an integration first" });

    const ips = ["192.168.1.1", "10.0.0.45", "172.16.0.100", "8.8.8.8", "45.12.33.1"];
    const geos = ["Brazil", "USA", "Germany", "China", "Unknown"];
    const methods = ["GET", "POST", "PUT", "DELETE"];
    const statuses = [200, 201, 400, 401, 403, 500];
    const auths = ["success", "failed", "none"];
    const tls = ["TLS 1.2", "TLS 1.3"];

    const count = 10;
    const stmt = db.prepare(`
      INSERT INTO logs (integration_id, ip, geo, method, status, auth_status, tls_version)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < count; i++) {
        const intId = integrations[Math.floor(Math.random() * integrations.length)].id;
        stmt.run(
            intId,
            ips[Math.floor(Math.random() * ips.length)],
            geos[Math.floor(Math.random() * geos.length)],
            methods[Math.floor(Math.random() * methods.length)],
            statuses[Math.floor(Math.random() * statuses.length)],
            auths[Math.floor(Math.random() * auths.length)],
            tls[Math.floor(Math.random() * tls.length)]
        );
    }

    res.json({ success: true, count });
  });

  // --- Vite / Frontend Setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus Server running on http://localhost:${PORT}`);
  });
}

startServer();
