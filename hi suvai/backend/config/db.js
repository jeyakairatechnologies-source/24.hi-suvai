const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Ensure temp and cache directories are on Drive E: (where 240GB+ free space is available)
const workspaceDir = path.join(__dirname, '..', '..');
const customTmp = path.join(workspaceDir, '.tmp');
const customMongoBin = path.join(workspaceDir, '.mongodb_bin');

if (!fs.existsSync(customTmp)) fs.mkdirSync(customTmp, { recursive: true });
if (!fs.existsSync(customMongoBin)) fs.mkdirSync(customMongoBin, { recursive: true });

process.env.TMP = customTmp;
process.env.TEMP = customTmp;
process.env.MONGOMS_DOWNLOAD_DIR = customMongoBin;

let memoryServerInstance = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hi_suvai';
  
  try {
    // Attempt standard connection with 3.5s timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3500,
    });
    console.log('MongoDB Connected Successfully');
    console.log(`Connected to: ${mongoUri.includes('@') ? 'MongoDB Atlas' : mongoUri}`);
  } catch (err) {
    console.warn(`\n[Notice] Local MongoDB (${mongoUri}) not detected: ${err.message}`);
    console.log('Starting resilient embedded MongoDB instance for seamless development on Drive E:...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create({
        instance: { dbName: 'hi_suvai' },
        binary: {
          downloadDir: customMongoBin,
          version: '7.0.14'
        }
      });
      const memUri = memoryServerInstance.getUri();
      await mongoose.connect(memUri);
      console.log('MongoDB Connected Successfully');
      console.log(`Connected to embedded MongoDB database: ${memUri}`);
    } catch (memErr) {
      console.error('Embedded MongoDB startup warning:', memErr.message);
      throw memErr;
    }
  }
};

module.exports = connectDB;
