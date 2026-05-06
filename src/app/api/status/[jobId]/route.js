import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import { repoQueue } from '@/lib/queue';

export async function GET(req, { params }) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    await connectDB();

    // First try to find by jobId in DB
    const project = await Project.findOne({ jobId });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // You can optionally fetch from BullMQ to get real-time progress if not updated in DB yet
    // const job = await repoQueue.getJob(jobId);
    // const progress = job ? job.progress : project.progress;

    return NextResponse.json({
      projectId: project._id,
      jobId: project.jobId,
      status: project.status,
      progress: project.progress,
      stage: project.stage,
      error: project.error,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    console.error('Error in /api/status:', error);
    const msg = String(error?.message || '');
    if (msg.includes('ENOTFOUND') || msg.includes('MongoServerSelectionError')) {
      return NextResponse.json({ error: 'Database temporarily unavailable.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
