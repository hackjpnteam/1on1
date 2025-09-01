import { Schema, models, model } from "mongoose";

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  password: String,
  image: String,
  role: { type: String, enum: ["admin", "manager", "member", "mentor"], default: "member" },
  department: { type: String, default: "" },
  reportsTo: { type: Schema.Types.ObjectId, ref: "User" },
  isMentor: { type: Boolean, default: false },
  googleCalendarId: String,
  googleRefreshToken: String,
  availableSlots: [{
    dayOfWeek: Number,
    startTime: String,
    endTime: String
  }],
  bio: String,
  expertise: [String],
}, { timestamps: true });

export default models.User || model("User", UserSchema);