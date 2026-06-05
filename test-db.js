const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "193.203.175.153",
  user: process.env.DB_USER || "u186798781_nexusapi",
  password: process.env.DB_PASSWORD || "LdWeb2026@",
  database: process.env.DB_NAME || "u186798781_nexusapi",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
};

async function test() {
  console.log("DB CONFIG:", { ...dbConfig, password: "xxx" });
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Connection successful!");
    
    const [integrations] = await connection.query("SELECT * FROM integrations");
    console.log("Integrations count:", integrations.length);
    
    const [logs] = await connection.query("SELECT * FROM logs LIMIT 5");
    console.log("Logs count:", logs.length);
    
    await connection.end();
  } catch (err) {
    console.error("DB TEST ERROR:", err);
  }
}

test();
