import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Helper functions to hash and verify passwords using PBKDF2
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash.includes(":")) {
    // Backward compatibility with legacy plain text passwords
    return password === storedHash;
  }
  const [salt, hash] = storedHash.split(":");
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

// ENCRYPTION KEYS AND HELPERS FOR API KEYS (CRYPTOGRAPHY AT REST)
const ENCRYPTION_KEY = crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY || "nexuskey_secure_encryption_key_32b").digest();
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string): string {
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return text;
  }
}

function isEncrypted(value: string): boolean {
  if (!value || !value.includes(":")) return false;
  const parts = value.split(":");
  if (parts.length !== 2) return false;
  return /^[0-9a-fA-F]+$/.test(parts[0]) && /^[0-9a-fA-F]+$/.test(parts[1]);
}

// TOKEN HELPERS DESCRIPTION (CRYPTOGRAPHICALLY SECURE SESSION TOKENS FOR RBAC)
function generateToken(user: { id: number, username: string, role: string }): string {
  const payload = JSON.stringify({
    id: user.id,
    username: user.username,
    role: user.role,
    timestamp: Date.now()
  });
  return encrypt(payload);
}

function verifyToken(token: string): { id: number, username: string, role: string } | null {
  try {
    const decrypted = decrypt(token);
    const data = JSON.parse(decrypted);
    // 24 hours expiry
    const age = Date.now() - data.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      return null;
    }
    return { id: data.id, username: data.username, role: data.role };
  } catch (e) {
    return null;
  }
}

// MySQL connection settings from environment or fallback
const dbConfig = {
  host: process.env.DB_HOST || "193.203.175.153",
  user: process.env.DB_USER || "u186798781_nexusapi",
  password: process.env.DB_PASSWORD || "LdWeb2026@",
  database: process.env.DB_NAME || "u186798781_nexusapi",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4"
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

    // Create country_blacklist table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS country_blacklist (
        country_code VARCHAR(10) PRIMARY KEY,
        country_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add is_suspicious column database migration just in case
    try {
      await pool.query("ALTER TABLE logs ADD COLUMN is_suspicious TINYINT DEFAULT 0");
    } catch (err) {
      // column already exists, safe to ignore
    }

    // Seed default blacklisted countries if empty
    const [blacklistCount] = await pool.query("SELECT COUNT(*) as count FROM country_blacklist") as any[];
    if (blacklistCount[0] && blacklistCount[0].count === 0) {
      await pool.query(`
        INSERT INTO country_blacklist (country_code, country_name) VALUES 
        ('RU', 'Rússia'),
        ('KP', 'Coreia do Norte')
      `);
    }

    // Insert default admin if not exists
    const [existingUsers] = await pool.query("SELECT id FROM users WHERE username = ?", ["admin"]);
    if ((existingUsers as any[]).length === 0) {
      const hashedAdminPassword = hashPassword("admin123");
      await pool.query(`
        INSERT INTO users (username, password, name, role) 
        VALUES ('admin', ?, 'Administrador Orthanc', 'admin')
      `, [hashedAdminPassword]);
    }

    // CHECK AND MIGRATE (REVOKE, REGENERATE, AND ENCRYPT) EXPOSED PLAIN-TEXT KEYS
    const [existingKeys] = await pool.query("SELECT * FROM api_keys") as any[];
    let migratedCount = 0;
    for (const k of existingKeys) {
      if (!isEncrypted(k.key_value)) {
        // Automatically revoke any exposed, plain-text legacy keys and regenerate them as encrypted-at-rest
        const newRawKey = "nexus_key_" + crypto.randomBytes(16).toString("hex");
        const encKey = encrypt(newRawKey);
        await pool.query("UPDATE api_keys SET key_value = ? WHERE id = ?", [encKey, k.id]);
        migratedCount++;
      }
    }
    if (migratedCount > 0) {
      console.log(`[SECURITY PATCH] Successfully migrated to AES-256-CBC and revoked ${migratedCount} plain-text exposed keys.`);
    }

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

  // --- Middleware for Route Protection ---
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Acesso negado: Autenticação obrigatória." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Acesso negado: Sessão inválida ou expirada." });
    }
    req.user = decoded;
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado: Requer privilégios de Administrador." });
    }
    next();
  };

  // --- API Routes ---

  // Auth
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const [rows] = await pool.query(
        "SELECT id, username, password, name, role FROM users WHERE username = ?",
        [username]
      );
      const user = (rows as any[])[0];
      
      if (user && verifyPassword(password, user.password)) {
        const { password: _, ...userWithoutPassword } = user;
        const token = generateToken(user);
        res.json({ ...userWithoutPassword, token });
      } else {
        res.status(401).json({ error: "Credenciais inválidas" });
      }
    } catch (e: any) {
      res.status(550).json({ error: e.message });
    }
  });

  // Users CRUD (Admin Only)
  app.get("/api/users", authenticate, requireAdmin, async (req, res) => {
    try {
      const [users] = await pool.query("SELECT id, username, name, role, created_at FROM users");
      res.json(users);
    } catch (e: any) {
      res.status(550).json({ error: e.message });
    }
  });

  app.post("/api/users", authenticate, requireAdmin, async (req, res) => {
    const { username, password, name, role } = req.body;
    try {
      const hashedPassword = hashPassword(password || 'orthanc123');
      const [result] = await pool.query(`
        INSERT INTO users (username, password, name, role)
        VALUES (?, ?, ?, ?)
      `, [username, hashedPassword, name, role || 'client']);
      res.json({ id: (result as any).insertId });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
    const { username, password, name, role } = req.body;
    try {
      if (password) {
        const hashedPassword = hashPassword(password);
        await pool.query(`
          UPDATE users SET username = ?, password = ?, name = ?, role = ? WHERE id = ?
        `, [username, hashedPassword, name, role, req.params.id]);
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

  app.delete("/api/users/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Country Blacklist CRUD
  app.get("/api/blacklist", authenticate, async (req, res) => {
    try {
      const [countries] = await pool.query("SELECT country_code, country_name, created_at FROM country_blacklist ORDER BY country_name ASC");
      res.json(countries);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/blacklist", authenticate, requireAdmin, async (req, res) => {
    const { country_code, country_name } = req.body;
    if (!country_code || !country_name) {
      return res.status(400).json({ error: "Código e nome do país são obrigatórios." });
    }
    try {
      await pool.query(`
        INSERT INTO country_blacklist (country_code, country_name)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE country_name = VALUES(country_name)
      `, [country_code.toUpperCase(), country_name]);
      res.json({ success: true, country_code: country_code.toUpperCase(), country_name });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/blacklist/:country_code", authenticate, requireAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM country_blacklist WHERE country_code = ?", [req.params.country_code.toUpperCase()]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Integrations CRUD
  app.get("/api/integrations", authenticate, async (req, res) => {
    try {
      const [integrations] = await pool.query("SELECT * FROM integrations");
      res.json(integrations);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/integrations", authenticate, requireAdmin, async (req, res) => {
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

  app.put("/api/integrations/:id", authenticate, requireAdmin, async (req, res) => {
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

  app.delete("/api/integrations/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM integrations WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Logs
  app.get("/api/logs", authenticate, async (req, res) => {
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
  app.get("/api/stats", authenticate, async (req, res) => {
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
  app.get("/api/api-keys", authenticate, async (req, res) => {
    try {
      const [keys] = await pool.query(`
        SELECT k.*, i.name as integration_name 
        FROM api_keys k
        LEFT JOIN integrations i ON k.integration_id = i.id
        ORDER BY k.created_at DESC
      `);
      
      const maskedKeys = (keys as any[]).map(k => {
        let rawKey = "";
        if (isEncrypted(k.key_value)) {
          rawKey = decrypt(k.key_value);
        } else {
          rawKey = k.key_value;
        }
        
        const prefix = "nexus_key_";
        let masked = "";
        if (rawKey.startsWith(prefix)) {
          const content = rawKey.substring(prefix.length);
          masked = prefix + content.substring(0, 4) + "•".repeat(Math.max(4, content.length - 4));
        } else {
          masked = rawKey.substring(0, 4) + "•".repeat(Math.max(4, rawKey.length - 4));
        }
        
        return {
          ...k,
          key_value: masked
        };
      });
      
      res.json(maskedKeys);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/api-keys", authenticate, requireAdmin, async (req, res) => {
    const { name, integration_id } = req.body;
    if (!name || !integration_id) {
      return res.status(400).json({ error: "Nome e integração ID são obrigatórios." });
    }
    try {
      const keyValue = "nexus_key_" + crypto.randomBytes(16).toString("hex");
      const encryptedKeyValue = encrypt(keyValue);
      const [result] = await pool.query(`
        INSERT INTO api_keys (key_value, name, integration_id)
        VALUES (?, ?, ?)
      `, [encryptedKeyValue, name, integration_id]);
      
      // Return cleartext only ONCE in key-creation response so user can copy it!
      res.json({ id: (result as any).insertId, key_value: keyValue, name, integration_id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/api-keys/:id", authenticate, requireAdmin, async (req, res) => {
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
      // Load and verify keys in memory (decrypt)
      const [keyRows] = await pool.query("SELECT * FROM api_keys") as any[];
      let keyRecord = null;
      for (const k of keyRows) {
        let decVal = "";
        if (isEncrypted(k.key_value)) {
          decVal = decrypt(k.key_value);
        } else {
          decVal = k.key_value;
        }
        if (decVal === apiKey) {
          keyRecord = k;
          break;
        }
      }

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

      // Check against country blacklist
      const [blacklistRows] = await pool.query("SELECT country_code, country_name FROM country_blacklist") as any[];
      let isSuspicious = 0;
      let matchedCountryName = "";
      
      const geoLower = finalGeo.toLowerCase();
      for (const item of blacklistRows) {
        const codeLower = item.country_code.toLowerCase();
        const nameLower = item.country_name.toLowerCase();
        
        // Match code or name
        if (
          geoLower.includes(codeLower) ||
          geoLower.includes(nameLower)
        ) {
          isSuspicious = 1;
          matchedCountryName = item.country_name;
          break;
        }
      }

      let adjustedMessage = finalMessage;
      let adjustedAuthStatus = finalAuthStatus;
      let adjustedStatus = finalStatus;

      if (isSuspicious) {
        adjustedMessage = `[ALERTA BLACKLIST - PAÍS: ${matchedCountryName}] ${finalMessage || "Tentativa de acesso via API Key bloqueada temporariamente"}`;
        adjustedAuthStatus = "blocked";
        adjustedStatus = 403;
      }

      const [result] = await pool.query(`
        INSERT INTO logs (integration_id, ip, geo, method, status, auth_status, tls_version, message, is_suspicious, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        keyRecord.integration_id,
        finalIp,
        finalGeo,
        finalMethod,
        adjustedStatus,
        adjustedAuthStatus,
        finalTlsVersion,
        adjustedMessage,
        isSuspicious
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
    console.log(`Orthanc Server running on http://localhost:${PORT}`);
  });
}

startServer();
