import 'dotenv/config';
import { getWorker } from '../lib/queue.js';
import processor from './processor.js';

console.log('Starting BullMQ worker for GitHub Explorer...');

const worker = getWorker(processor);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err);
});

worker.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}, closing worker...`);
  await worker.close();
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Keep the event loop alive since the mock queue doesn't have open network connections
setInterval(() => {}, 1000 * 60 * 60);
