import { Schema, models, model } from "mongoose";

const PersonRatingSchema = new Schema({
  personId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  ratedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
  category: { type: String, enum: ["mentoring", "leadership", "communication", "overall"], default: "overall" },
}, { timestamps: true });

PersonRatingSchema.index({ personId: 1, createdAt: -1 });

export default models.PersonRating || model("PersonRating", PersonRatingSchema);