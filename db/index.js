const Record = require('./model');
const vaultEvents = require('../events');
const { createBackup } = require('./backup');
const recordUtils = require('./record');

async function addRecord({ name, value }) {
  recordUtils.validateRecord({ name, value });
  const newRecord = new Record({ name, value });
  await newRecord.save();
  vaultEvents.emit('recordAdded', newRecord);
  
  // Create backup after adding record
  const allRecords = await Record.find({}).lean();
  createBackup(allRecords);
  
  return newRecord;
}

async function listRecords() {
  return await Record.find({}).lean();
}

async function updateRecord(id, newName, newValue) {
  const record = await Record.findById(id);
  if (!record) return null;
  record.name = newName;
  record.value = newValue;
  await record.save();
  vaultEvents.emit('recordUpdated', record);
  return record;
}

async function deleteRecord(id) {
  const record = await Record.findByIdAndDelete(id);
  if (!record) return null;
  vaultEvents.emit('recordDeleted', record);
  
  // Create backup after deleting record
  const allRecords = await Record.find({}).lean();
  createBackup(allRecords);
  
  return record;
}

async function searchRecords(keyword) {
  const records = await Record.find({}).lean();
  const keywordLower = keyword.toLowerCase();
  
  return records.filter(record => {
    // Case-insensitive name search
    const nameMatch = record.name.toLowerCase().includes(keywordLower);
    // ID search (convert to string and check if contains)
    const idMatch = String(record._id).includes(keyword);
    return nameMatch || idMatch;
  });
}

async function sortRecords(field, order) {
  const records = await Record.find({}).lean();
  const sorted = [...records]; // Create a copy
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    if (field === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (field === 'date') {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      comparison = dateA - dateB;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

async function getStatistics() {
  const records = await Record.find({}).lean();
  const fs = require('fs');
  const path = require('path');
  
  const stats = {
    totalRecords: records.length,
    longestName: null,
    longestNameLength: 0,
    earliestDate: null,
    latestDate: null,
    lastModified: null
  };
  
  if (records.length > 0) {
    // Find longest name
    records.forEach(record => {
      if (record.name.length > stats.longestNameLength) {
        stats.longestNameLength = record.name.length;
        stats.longestName = record.name;
      }
    });
    
    // Find earliest and latest creation dates
    const dates = records.map(r => new Date(r.createdAt)).sort((a, b) => a - b);
    stats.earliestDate = dates[0];
    stats.latestDate = dates[dates.length - 1];
    
    // Get last modified time from the most recent updatedAt
    const updatedDates = records.map(r => new Date(r.updatedAt || r.createdAt)).sort((a, b) => b - a);
    stats.lastModified = updatedDates[0];
  }
  
  return stats;
}

async function exportData() {
  const records = await Record.find({}).lean();
  const fs = require('fs');
  const path = require('path');
  
  const exportPath = path.join(__dirname, '..', 'export.txt');
  const now = new Date();
  const exportTime = now.toISOString().replace('T', ' ').substring(0, 19);
  
  let content = `========================================\n`;
  content += `VAULT DATA EXPORT\n`;
  content += `========================================\n`;
  content += `Export Date/Time: ${exportTime}\n`;
  content += `Total Records: ${records.length}\n`;
  content += `File Name: export.txt\n`;
  content += `========================================\n\n`;
  
  if (records.length === 0) {
    content += `No records found.\n`;
  } else {
    records.forEach((record, index) => {
      const createdAt = new Date(record.createdAt).toISOString().substring(0, 10);
      content += `Record ${index + 1}:\n`;
      content += `  ID: ${record._id}\n`;
      content += `  Name: ${record.name}\n`;
      content += `  Value: ${record.value}\n`;
      content += `  Created: ${createdAt}\n`;
      content += `\n`;
    });
  }
  
  fs.writeFileSync(exportPath, content);
  return exportPath;
}

module.exports = { 
  addRecord, 
  listRecords, 
  updateRecord, 
  deleteRecord,
  searchRecords,
  sortRecords,
  getStatistics,
  exportData
};
