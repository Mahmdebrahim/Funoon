const mongoose = require("mongoose");
const logger = require("../utils/logger")

const connectDB = async () => {
  try {
    const DB_NAME = "funoon_dev";
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: DB_NAME, 
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${DB_NAME}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
