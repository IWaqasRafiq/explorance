import { ChatService } from '../services/chat.service.js';
import { VectorService } from '../services/vector.service.js';
import { connectDB } from './db.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testChat() {
  console.log(`--- Step 5 Verification: "Ask Repo" ---`);
  
  try {
    await connectDB();
    const mockProjectId = new mongoose.Types.ObjectId();

    // 1. Seed some realistic code logic
    console.log(`Seeding mock code for analysis...`);
    const codeData = [
      { 
        content: `function calculateTotal(items) {
          return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }`, 
        metadata: { source: 'cart.js' } 
      },
      { 
        content: `const TAX_RATE = 0.05;
        function applyTax(amount) {
          return amount * (1 + TAX_RATE);
        }`, 
        metadata: { source: 'tax.js' } 
      }
    ];
    await VectorService.storeChunks(mockProjectId, codeData);

    // 2. Ask a logical question
    const query = "How is the total price calculated and what is the tax rate?";
    console.log(`\nUser Question: "${query}"`);
    
    const answer = await ChatService.askRepository(mockProjectId, query);
    
    console.log(`\n--- AI RESPONSE ---`);
    console.log(answer);
    console.log(`-------------------\n`);

    // Cleanup
    await mongoose.model('CodeChunk').deleteMany({ projectId: mockProjectId });
    console.log(`✓ Step 5 Complete.`);
  } catch (error) {
    console.error(`\nChat test failed:`, error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testChat();
