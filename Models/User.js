import mongoose from 'mongoose';
import jwt from "jsonwebtoken";

export const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phonenumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  profile: { type: String, default: "" },
  token: { type: String, default: "" },
  is_staff: { type: Boolean, default: false },
  role: { type: String, enum: ["Customer", "Admin"], default: "Customer" },
  last_login: { type: Date },
  is_active: { type: Boolean, default: true },
  is_deactive: { type: Boolean, default: false }
}, {
  timestamps: true
});

userSchema.methods.generateAccessToken = function () {
  return jwt.sign({
    _id: this._id,
    email: this.email
  }, process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }

  )
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({
    _id: this._id,
    email: this.email
  }, process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }

  )
}

export const User = mongoose.model("User", userSchema);

// http://localhost:8000/api/users/auth