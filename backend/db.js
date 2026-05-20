const { spawn } = require('child_process');
const { createClient } = require('@libsql/client');

let lock = Promise.resolve();
let client = null;

// Initialize Turso client if URL is provided (Production)
if (process.env.TURSO_DATABASE_URL) {
  client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

/**
 * Executes a SQL query with optional parameters.
 * Uses Turso client if available, otherwise falls back to team-db CLI.
 */
async function query(sql, params = []) {
  if (client) {
    // Production path using libSQL client
    try {
      const result = await client.execute({ sql, args: params });
      
      // Map libSQL result to the format expected by the app (array of rows)
      return result.rows.map(row => {
        const obj = {};
        result.columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
    } catch (error) {
      console.error('Turso Query Error:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  // Development path using team-db CLI
  // Note: team-db CLI doesn't support parameterized queries directly.
  // We'll perform basic string replacement for dev convenience, 
  // but production should always use the libSQL client path.
  let finalSql = sql;
  if (params && params.length > 0) {
    // Very basic placeholder replacement for team-db compatibility
    // This is NOT safe for production but fine for the dev team-db tool
    params.forEach((param, i) => {
      const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
      // Replace ? with values sequentially
      finalSql = finalSql.replace('?', value);
    });
  }

  return new Promise((resolve, reject) => {
    lock = lock.then(async () => {
      try {
        const child = spawn('team-db', [finalSql]);
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data;
        });

        child.stderr.on('data', (data) => {
          stderr += data;
        });

        child.on('close', (code) => {
          if (stderr && !stderr.includes('Synced')) {
            console.error('team-db stderr:', stderr);
          }
          if (code !== 0) {
            reject(new Error(`team-db failed with code ${code}: ${stderr}`));
            return;
          }
          try {
            if (!stdout.trim()) {
              resolve([]);
              return;
            }
            resolve(JSON.parse(stdout));
          } catch (e) {
            console.error('Failed to parse team-db output:', stdout);
            reject(e);
          }
        });
      } catch (error) {
        console.error('Error executing SQL:', error);
        console.error('SQL was:', finalSql);
        reject(error);
      }
    }).catch(err => {
      console.error('Lock chain error:', err);
      reject(err);
    });
  });
}

module.exports = { query };
