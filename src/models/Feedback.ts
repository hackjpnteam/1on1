import { Schema, models, model } from "mongoose";

const FeedbackSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
}, { timestamps: true });

FeedbackSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

export default models.Feedback || model("Feedback", FeedbackSchema);