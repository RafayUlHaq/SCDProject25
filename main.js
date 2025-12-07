require('dotenv').config();
const readline = require('readline');
const db = require('./db');
const { connectDB } = require('./db/connection');
require('./events/logger'); // Initialize event logger

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB at startup
connectDB().then(() => {
  menu();
}).catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

function menu() {
  console.log(`
===== NodeVault =====
1. Add Record
2. List Records
3. Update Record
4. Delete Record
5. Search Records
6. Sort Records
7. Export Data
8. View Vault Statistics
9. Exit
=====================
  `);

  rl.question('Choose option: ', async (ans) => {
    switch (ans.trim()) {
      case '1':
        rl.question('Enter name: ', name => {
          rl.question('Enter value: ', async value => {
            try {
              await db.addRecord({ name, value });
              console.log('Record added successfully!');
            } catch (err) {
              console.error('Error adding record:', err.message);
            }
            menu();
          });
        });
        break;

      case '2':
        try {
          const records = await db.listRecords();
          if (records.length === 0) {
            console.log('No records found.');
          } else {
            records.forEach(r => {
              const createdAt = new Date(r.createdAt).toISOString().substring(0, 10);
              console.log(`ID: ${r._id} | Name: ${r.name} | Value: ${r.value} | Created: ${createdAt}`);
            });
          }
        } catch (err) {
          console.error('Error listing records:', err.message);
        }
        menu();
        break;

      case '3':
        rl.question('Enter record ID to update: ', id => {
          rl.question('New name: ', name => {
            rl.question('New value: ', async value => {
              try {
                const updated = await db.updateRecord(id, name, value);
                console.log(updated ? 'Record updated!' : 'Record not found.');
              } catch (err) {
                console.error('Error updating record:', err.message);
              }
              menu();
            });
          });
        });
        break;

      case '4':
        rl.question('Enter record ID to delete: ', async id => {
          try {
            const deleted = await db.deleteRecord(id);
            console.log(deleted ? 'Record deleted!' : 'Record not found.');
          } catch (err) {
            console.error('Error deleting record:', err.message);
          }
          menu();
        });
        break;

      case '5':
        rl.question('Enter search keyword: ', async keyword => {
          try {
            const results = await db.searchRecords(keyword);
            if (results.length === 0) {
              console.log('No records found.');
            } else {
              results.forEach(r => {
                const createdAt = new Date(r.createdAt).toISOString().substring(0, 10);
                console.log(`ID: ${r._id} | Name: ${r.name} | Created: ${createdAt}`);
              });
            }
          } catch (err) {
            console.error('Error searching records:', err.message);
          }
          menu();
        });
        break;

      case '6':
        rl.question('Choose field to sort by: (1) Name, (2) Creation Date: ', fieldChoice => {
          const field = fieldChoice.trim() === '1' ? 'name' : 'date';
          rl.question('Choose order: (1) Ascending, (2) Descending: ', orderChoice => {
            const order = orderChoice.trim() === '1' ? 'asc' : 'desc';
            (async () => {
              try {
                const sorted = await db.sortRecords(field, order);
                if (sorted.length === 0) {
                  console.log('No records found.');
                } else {
                  console.log(`\nSorted Records (${field}, ${order}):`);
                  sorted.forEach(r => {
                    const createdAt = new Date(r.createdAt).toISOString().substring(0, 10);
                    console.log(`ID: ${r._id} | Name: ${r.name} | Created: ${createdAt}`);
                  });
                }
              } catch (err) {
                console.error('Error sorting records:', err.message);
              }
              menu();
            })();
          });
        });
        break;

      case '7':
        try {
          const exportPath = await db.exportData();
          console.log('Data exported successfully to export.txt');
        } catch (err) {
          console.error('Error exporting data:', err.message);
        }
        menu();
        break;

      case '8':
        try {
          const stats = await db.getStatistics();
          console.log('\nVault Statistics:');
          console.log('--------------------------');
          console.log(`Total Records: ${stats.totalRecords}`);
          
          if (stats.lastModified) {
            const lastMod = new Date(stats.lastModified).toISOString().replace('T', ' ').substring(0, 19);
            console.log(`Last Modified: ${lastMod}`);
          }
          
          if (stats.longestName) {
            console.log(`Longest Name: ${stats.longestName} (${stats.longestNameLength} characters)`);
          }
          
          if (stats.earliestDate) {
            const earliest = new Date(stats.earliestDate).toISOString().substring(0, 10);
            console.log(`Earliest Record: ${earliest}`);
          }
          
          if (stats.latestDate) {
            const latest = new Date(stats.latestDate).toISOString().substring(0, 10);
            console.log(`Latest Record: ${latest}`);
          }
          
          console.log('--------------------------\n');
        } catch (err) {
          console.error('Error getting statistics:', err.message);
        }
        menu();
        break;

      case '9':
        console.log('Exiting NodeVault...');
        rl.close();
        process.exit(0);
        break;

      default:
        console.log('Invalid option.');
        menu();
    }
  });
}
