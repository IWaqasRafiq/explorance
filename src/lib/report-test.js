import { ReportService } from '../services/report.service.js';
import mongoose from 'mongoose';

async function testFullReport() {
  console.log(`--- Step 7 Verification: Full Insights Report ---`);

  const mockFiles = [
    {
      path: 'src/app.js',
      lines: 50,
      content: `
        import { login } from './auth.js';
        import { db } from './db.js';
        
        const startApp = () => {
          db.connect();
          console.log("App started");
        }
        
        startApp();
      `
    },
    {
      path: 'src/auth.js',
      lines: 30,
      content: `
        export const login = (u) => { console.log("Login..."); }
        export const signup = (u) => { console.log("Signup..."); }
        
        // This is a duplicate of a block in utils.js
        function logAction(action) {
          console.log("Action performed: " + action);
          console.log("Timestamp: " + new Date().toISOString());
          console.log("User: " + (global.user || 'anonymous'));
        }
      `
    },
    {
      path: 'src/utils.js',
      lines: 25,
      content: `
        // Duplicate block
        function logAction(action) {
          console.log("Action performed: " + action);
          console.log("Timestamp: " + new Date().toISOString());
          console.log("User: " + (global.user || 'anonymous'));
        }
      `
    }
  ];

  try {
    const mockProjectId = new mongoose.Types.ObjectId();
    const finalReport = await ReportService.generateFullReport(mockProjectId, mockFiles);

    console.log(`\n--- FINAL GENERATED REPORT ---`);
    console.log(JSON.stringify(finalReport, null, 2));
    console.log(`\n------------------------------`);

    console.log(`\nStep 7 Complete.`);
  } catch (error) {
    console.error(`\nReport test failed:`, error.message);
  }
}

testFullReport();
