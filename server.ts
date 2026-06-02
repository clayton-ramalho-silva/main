import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// MySQL connection settings from environment or fallback
const dbConfig = {
  host: process.env.DB_HOST || "193.203.175.153",
  user: process.env.DB_USER || "u186798781_nexusapi",
  password: process.env.DB_PASSWORD || "LdWeb2026@",
  database: process.env.DB_NAME || "u186798781_nexusapi",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Initialize Database Schema on start
async function initDb() {
  try {
    console.log("Initializing database tables if they do not exist...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        origin VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        port INT NOT NULL,
        protocol VARCHAR(50) NOT NULL,
        access_type VARCHAR(50) NOT NULL,
        tls_version VARCHAR(50),
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        integration_id INT,
        ip VARCHAR(50),
        geo VARCHAR(255),
        method VARCHAR(10),
        status INT,
        auth_status VARCHAR(50),
        tls_version VARCHAR(50),
        message TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(integration_id) REFERENCES integrations(id) ON DELETE CASCADE
      )
    `);

    try {
      await pool.query("ALTER TABLE logs ADD COLUMN message TEXT");
    } catch (err) {
      // Ignora erro se coluna já existir
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_value VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        integration_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(integration_id) REFERENCES integrations(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        threshold INT,
        active TINYINT DEFAULT 1
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'client',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin if not exists
    await pool.query(`
      INSERT IGNORE INTO users (username, password, name, role) 
      VALUES ('admin', 'admin123', 'Administrador Nexus', 'admin')
    `);

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize database tables:", error);
  }
}

async function startServer() {
  // Initialize DB Tables
  await initDb();

  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // --- API Routes ---

  // Auth
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const [rows] = await pool.query(
        "SELECT id, username, name, role FROM users WHERE username = ? AND password = ?",
        [username, password]
      );
      const user = (rows as any[])[0];
      
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: "Credenciais inválidas" });
      }
    } catch (e: any) {
      res.status(550).json({ error: e.message });
    }
  });

  // Users CRUD
  app.get("/api/users", async (req, res) => {
    try {
      const [users] = await pool.query("SELECT id, username, name, role, created_at FROM users");
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    const { username, password, name, role } = req.body;
    try {
      const [result] = await pool.query(`
        INSERT INTO users (username, password, name, role)
        VALUES (?, ?, ?, ?)
      `, [username, password || 'nexus123', name, role || 'client']);
      res.json({ id: (result as any).insertId });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    const { username, password, name, role } = req.body;
    try {
      if (password) {
        await pool.query(`
          UPDATE users SET username = ?, password = ?, name = ?, role = ? WHERE id = ?
        `, [username, password, name, role, req.params.id]);
      } else {
        await pool.query(`
          UPDATE users SET username = ?, name = ?, role = ? WHERE id = ?
        `, [username, name, role, req.params.id]);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Integrations CRUD
  app.get("/api/integrations", async (req, res) => {
    try {
      const [integrations] = await pool.query("SELECT * FROM integrations");
      res.json(integrations);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/integrations", async (req, res) => {
    const { name, origin, destination, port, protocol, access_type, tls_version, observations } = req.body;
    try {
      const [result] = await pool.query(`
        INSERT INTO integrations (name, origin, destination, port, protocol, access_type, tls_version, observations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, origin, destination, port, protocol, access_type, tls_version, observations]);
      res.json({ id: (result as any).insertId });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/integrations/:id", async (req, res) => {
    const { name, origin, destination, port, protocol, access_type, tls_version, observations } = req.body;
    try {
      await pool.query(`
        UPDATE integrations 
        SET name = ?, origin = ?, destination = ?, port = ?, protocol = ?, access_type = ?, tls_version = ?, observations = ?
        WHERE id = ?
      `, [name, origin, destination, port, protocol, access_type, tls_version, observations, req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/integrations/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM integrations WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Logs
  app.get("/api/logs", async (req, res) => {
    try {
      const [logs] = await pool.query(`
        SELECT l.*, i.name as integration_name 
        FROM logs l 
        LEFT JOIN integrations i ON l.integration_id = i.id 
        ORDER BY timestamp DESC LIMIT 100
      `);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Dashboard Stats
  app.get("/api/stats", async (req, res) => {
    const integrationId = req.query.integrationId;
    const whereClause = integrationId ? "WHERE integration_id = ?" : "";
    const params = integrationId ? [integrationId] : [];

    try {
      const [volumeRows] = await pool.query(`SELECT count(*) as count FROM logs ${whereClause}`, params) as any[];
      const volume = volumeRows[0] || { count: 0 };

      const errorsWhere = integrationId ? `${whereClause} AND status >= 400` : "WHERE status >= 400";
      const [errorsRows] = await pool.query(`SELECT count(*) as count FROM logs ${errorsWhere}`, params) as any[];
      const errors = errorsRows[0] || { count: 0 };

      const authWhere = integrationId ? `${whereClause} AND auth_status = 'failed'` : "WHERE auth_status = 'failed'";
      const [authRows] = await pool.query(`SELECT count(*) as count FROM logs ${authWhere}`, params) as any[];
      const authFailures = authRows[0] || { count: 0 };
      
      const [methods] = await pool.query(`SELECT method, count(*) as count FROM logs ${whereClause} GROUP BY method`, params);
      
      const timelineSql = `
        SELECT DATE_FORMAT(timestamp, '%H:00') as hour, count(*) as count 
        FROM logs 
        WHERE timestamp > NOW() - INTERVAL 24 HOUR
        ${integrationId ? "AND integration_id = ?" : ""}
        GROUP BY hour
      `;
      const [timeline] = await pool.query(timelineSql, params);

      res.json({
        summary: {
          totalVolume: volume.count,
          errorRate: volume.count > 0 ? ((errors.count / volume.count) * 100).toFixed(1) : 0,
          authFailures: authFailures.count,
        },
        methods,
        timeline
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- API Key Management ---
  app.get("/api/api-keys", async (req, res) => {
    try {
      const [keys] = await pool.query(`
        SELECT k.*, i.name as integration_name 
        FROM api_keys k
        LEFT JOIN integrations i ON k.integration_id = i.id
        ORDER BY k.created_at DESC
      `);
      res.json(keys);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/api-keys", async (req, res) => {
    const { name, integration_id } = req.body;
    if (!name || !integration_id) {
      return res.status(400).json({ error: "Nome e integração ID são obrigatórios." });
    }
    try {
      const keyValue = "nexus_key_" + crypto.randomBytes(16).toString("hex");
      const [result] = await pool.query(`
        INSERT INTO api_keys (key_value, name, integration_id)
        VALUES (?, ?, ?)
      `, [keyValue, name, integration_id]);
      res.json({ id: (result as any).insertId, key_value: keyValue, name, integration_id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/api-keys/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM api_keys WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Public Webhook/API Log Registration ---
  app.get("/api/logs/register", (req, res) => {
    res.status(405).json({ 
      error: "Método Não Permitido. Use o método POST para registrar logs.",
      instructions: "Envie uma requisição POST contendo a sua API Key no cabeçalho X-API-Key, Authorization Bearer ou no corpo da requisição."
    });
  });

  app.post("/api/logs/register", async (req, res) => {
    let apiKey = req.headers["x-api-key"] || req.body.api_key || req.query.api_key;
    
    const authHeader = req.headers["authorization"];
    if (!apiKey && authHeader && typeof authHeader === "string") {
      if (authHeader.startsWith("Bearer ")) {
        apiKey = authHeader.split(" ")[1];
      } else {
        apiKey = authHeader;
      }
    }

    if (!apiKey) {
      return res.status(401).json({ 
        error: "Não autorizado: Chave de API (API Key) ausente. Envie no header X-API-Key, Authorization Bearer ou no corpo/query como 'api_key'." 
      });
    }

    try {
      const [keyRows] = await pool.query("SELECT * FROM api_keys WHERE key_value = ?", [apiKey]) as any[];
      const keyRecord = keyRows[0];
      if (!keyRecord) {
        return res.status(401).json({ error: "Não autorizado: API Key inválida ou inexistente." });
      }

      const { ip, geo, method, status, auth_status, tls_version, message } = req.body;

      // Sensible defaults if not specified
      const finalIp = ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      const finalGeo = geo || "Desconhecido";
      const finalMethod = (method || "POST").toUpperCase();
      const finalStatus = status !== undefined ? parseInt(status) : 200;
      const finalAuthStatus = auth_status || "success";
      const finalTlsVersion = tls_version || "TLS 1.3";
      const finalMessage = message !== undefined ? String(message) : null;

      const [result] = await pool.query(`
        INSERT INTO logs (integration_id, ip, geo, method, status, auth_status, tls_version, message, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        keyRecord.integration_id,
        finalIp,
        finalGeo,
        finalMethod,
        finalStatus,
        finalAuthStatus,
        finalTlsVersion,
        finalMessage
      ]);

      res.status(201).json({
        success: true,
        message: "Log registrado com sucesso!",
        log_id: (result as any).insertId,
        integration_id: keyRecord.integration_id,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Erro ao registrar log externo:", err);
      res.status(500).json({ error: "Erro interno do servidor ao processar o log." });
    }
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
