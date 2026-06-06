const fs = require('fs');
const path = require('path');
const { getDb } = require('../config/db');

async function backup() {
  const db = await getDb();
  const data = db.export();
  const backupDir = path.join(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const filename = `oj-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.db`;
  fs.writeFileSync(path.join(backupDir, filename), Buffer.from(data));
  console.log(`Backup saved: ${filename}`);
  process.exit(0);
}

backup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
