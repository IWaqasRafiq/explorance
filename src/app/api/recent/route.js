import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';

export async function GET() {
  try {
    await connectDB();
    
    const projects = await Project.find({ status: 'completed' })
      .select('_id repoUrl createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
      
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error in /api/recent:', error);
    const msg = String(error?.message || '');
    if (msg.includes('ENOTFOUND') || msg.includes('MongoServerSelectionError')) {
      return NextResponse.json({ error: 'Database temporarily unavailable.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
