const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { seedData } = require('./seeders/seed');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedData(true); // Automatically ensure Super Admin & sample quiz exist

    const server = app.listen(PORT, () => {
      console.log(`[Server] Quiz Management System Backend running on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n[Port Conflict Error] Port ${PORT} is already in use by another process.`);
        console.error(`To free port ${PORT} on Windows PowerShell, run: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
        process.exit(1);
      } else {
        console.error('[Server Error]', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('[Server Error]', error);
    process.exit(1);
  }
};

startServer();
