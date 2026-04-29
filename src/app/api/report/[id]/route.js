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

    if (project.status !== 'completed') {
      return NextResponse.json({ 
        message: 'Analysis is not yet complete', 
        status: project.status 
      }, { status: 400 });
    }

    const report = await AnalysisResult.findOne({ projectId: id });
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      project,
      report,
    });
  } catch (error) {
    console.error('Error in /api/report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
