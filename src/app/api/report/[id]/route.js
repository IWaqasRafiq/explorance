import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import AnalysisResult from '@/models/AnalysisResult';

export async function GET(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    await connectDB();

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isPartial = project.status !== 'completed';

    const report = await AnalysisResult.findOne({ projectId: id });

    // If no report data exists at all, block the request
    if (!report) {
      if (isPartial) {
        return NextResponse.json({
          error: 'Analysis is still in progress. No report data yet.',
          status: project.status
        }, { status: 202 });
      }
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      project,
      report,
      partial: isPartial,  // ← signals the frontend to show the partial banner
    });
  } catch (error) {
    console.error('Error in /api/report:', error);
    const msg = String(error?.message || '');
    if (msg.includes('ENOTFOUND') || msg.includes('MongoServerSelectionError')) {
      return NextResponse.json({ error: 'Database temporarily unavailable.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
