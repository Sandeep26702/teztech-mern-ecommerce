import mongoose from "mongoose";

const noteEntrySchema = new mongoose.Schema({
  author: { type: String, default: "Sales Team" },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const clientNoteSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    clientEmail: { type: String, lowercase: true, trim: true },
    clientPhone: { type: String, default: "", trim: true },
    notes: [noteEntrySchema]
  },
  { timestamps: true }
);

// Custom sparse unique indexes to support client notes lookup by email or phone
clientNoteSchema.index({ clientEmail: 1 }, { unique: true, sparse: true });
clientNoteSchema.index({ clientPhone: 1 }, { unique: true, sparse: true });

export default mongoose.model("ClientNote", clientNoteSchema);
