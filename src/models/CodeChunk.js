import mongoose from 'mongoose';

const codeChunkSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  content: { type: String, required: true },
  embedding: { type: [Number], required: true }, // The vector
  metadata: {
    source: String,
    extension: String,
    chunkIndex: Number,
    totalChunks: Number,
    language: String
  },
  createdAt: { type: Date, default: Date.now }
});

// Indexing for faster cleanup and project-based lookups
codeChunkSchema.index({ projectId: 1 });

const CodeChunk = mongoose.models.CodeChunk || mongoose.model('CodeChunk', codeChunkSchema);
export default CodeChunk;
