import { Schema, models, model } from "mongoose";

const PairSchema = new Schema({
  managerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  cadence: { type: String, enum: ["weekly", "biweekly", "monthly"], default: "biweekly" },
  active: { type: Boolean, default: true },
}, { timestamps: true });

PairSchema.index({ managerId: 1, memberId: 1 }, { unique: true });

export default models.Pair || model("Pair", PairSchema);