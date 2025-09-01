import { Schema, models, model } from "mongoose";

const SessionSchema = new Schema({
  pairId: { type: Schema.Types.ObjectId, ref: "Pair", required: true },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ["scheduled", "completed", "canceled"], default: "scheduled" },
  agenda: { type: String, default: "" },
  notesShared: { type: String, default: "" },
  notesPrivate: { type: String, default: "" },
  tags: [{ type: String }],
}, { timestamps: true });

SessionSchema.index({ scheduledAt: -1 });

export default models.Session || model("Session", SessionSchema);