import { EventEmitter } from 'events';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import processor from '../worker/processor.js';

const USE_REAL_QUEUE = process.env.USE_REAL_QUEUE === 'true';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// IN-MEMORY MOCK QUEUE (For development without Redis)
class MockQueue {
  constructor(name) {
    this.name = name;
    this.jobs = new Map();
    this.events = new EventEmitter();
    this.processor = null;
  }

  async add(name, data) {
    const job = {
      id: Math.random().toString(36).substring(7),
      data,
      progress: 0,
      updateProgress: async (p) => {
        job.progress = p;
        this.events.emit('progress', job, p);
      }
    };

    this.jobs.set(job.id, job);

    // Process the job asynchronously in the background
    if (this.processor) {
      setTimeout(async () => {
        try {
          await this.processor(job);
          this.events.emit('completed', job);
        } catch (error) {
          this.events.emit('failed', job, error);
        }
      }, 100);
    }

    return job;
  }

  async getJob(id) {
    return this.jobs.get(id);
  }
}

let queue;
if (USE_REAL_QUEUE) {
  console.log('Using real BullMQ with Redis');
  const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  queue = new Queue('repo-processing', { connection });
} else {
  console.log('Using mock in-memory queue');
  queue = new MockQueue('repo-processing');
  // In mock mode, automatically register the processor so jobs added in this process are handled
  queue.processor = processor;
  console.log('Mock processor registered in current process');
}

export const repoQueue = queue;

export const getWorker = (proc) => {
  if (USE_REAL_QUEUE) {
    const connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    return new Worker('repo-processing', proc, { connection });
  } else {
    repoQueue.processor = proc;
    // Mimic the worker close method
    repoQueue.events.close = async () => { console.log('Mock worker closed'); };
    return repoQueue.events;
  }
};
