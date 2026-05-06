import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import { repoQueue } from '@/lib/queue';

export async function POST(req) {
  try {
    const body = await req.json();
    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== 'string' || !repoUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid repository URL' }, { status: 400 });
    }

    await connectDB();

    // Create new project
    let project = await Project.create({
      repoUrl,
      status: 'pending',
    });

    // Add job to queue
    const job = await repoQueue.add('analyze-repo', {
      projectId: project._id,
      repoUrl: project.repoUrl,
    });

    // Update project with jobId
    project.jobId = job.id;
    await project.save();

    return NextResponse.json({
      message: 'Analysis job added to queue',
      jobId: job.id,
      projectId: project._id,
    }, { status: 202 });

  } catch (error) {
    console.error('Error in /api/analyze:', error);
    const msg = String(error?.message || '');
    if (msg.includes('ENOTFOUND') || msg.includes('MongoServerSelectionError')) {
      return NextResponse.json({
        error: 'Database connection failed. Check your network/VPN or MongoDB URI, then retry.'
      }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
