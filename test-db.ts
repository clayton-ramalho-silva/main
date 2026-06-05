import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "193.203.175.153",
  user: process.env.DB_USER || "u186798781_nexusapi",
  password: process.env.DB_PASSWORD || "LdWeb2026@",
  database: process.env.DB_NAME || "u186798781_nexusapi",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
};

async function test() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Connection successful!");

    const integrationId = "2";
    const whereClause = integrationId ? "WHERE integration_id = ?" : "";
    const params = integrationId ? [integrationId] : [];

    console.log("Testing Stats with integrationId:", integrationId);
    
    const [volumeRows] = await connection.query(`SELECT count(*) as count FROM logs ${whereClause}`, params) as any[];
    console.log("Volume:", volumeRows);

    const errorsWhere = integrationId ? `${whereClause} AND status >= 400` : "WHERE status >= 400";
    const [errorsRows] = await connection.query(`SELECT count(*) as count FROM logs ${errorsWhere}`, params) as any[];
    console.log("Errors:", errorsRows);

    const authWhere = integrationId ? `${whereClause} AND auth_status = 'failed'` : "WHERE auth_status = 'failed'";
    const [authRows] = await connection.query(`SELECT count(*) as count FROM logs ${authWhere}`, params) as any[];
    console.log("Auth failures:", authRows);

    const [methods] = await connection.query(`SELECT method, count(*) as count FROM logs ${whereClause} GROUP BY method`, params);
    console.log("Methods:", methods);

    const timelineSql = `
      SELECT DATE_FORMAT(timestamp, '%H:00') as hour, count(*) as count 
      FROM logs 
      WHERE timestamp > NOW() - INTERVAL 24 HOUR
      ${integrationId ? "AND integration_id = ?" : ""}
      GROUP BY hour
    `;
    const [timeline] = await connection.query(timelineSql, params);
    console.log("Timeline:", timeline);

    await connection.end();
  } catch (err: any) {
    console.error("DB TEST ERROR:", err.message, err.stack);
  }
}

test();
