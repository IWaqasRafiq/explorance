import mongoose from 'mongoose';

const AnalysisResultSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    reportData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    }
  },
  { timestamps: true }
);

export default mongoose.models.AnalysisResult || mongoose.model('AnalysisResult', AnalysisResultSchema);
