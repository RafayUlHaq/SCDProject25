const fs = require('fs');
const path = require('path');

function createBackup(records) {
  const backupsDir = path.join(__dirname, '..', 'backups');
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Generate backup filename with timestamp
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .replace(/\..+/, '');
  const filename = `backup_${timestamp}.json`;
  const filepath = path.join(backupsDir, filename);

  // Write backup file
  fs.writeFileSync(filepath, JSON.stringify(records, null, 2));
  
  console.log(`Backup created at backups/${filename}`);
}

module.exports = { createBackup };

