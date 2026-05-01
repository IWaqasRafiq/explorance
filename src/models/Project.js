import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    repoUrl: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: {
      type: String,
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    stage: {
      type: String,
      default: 'Initializing',
    },
    error: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
