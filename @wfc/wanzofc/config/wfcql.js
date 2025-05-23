const wfcql = require('wanzofc-sql');
const path = require('path');

const connectDB = () => {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'db', 'default.wfc.db.json');
    try {
        wfcql.connect(dbPath);
    } catch (error) {
        console.error("Failed to connect to WFC-SQL database:", error);
        process.exit(1);
    }
};

module.exports = connectDB;