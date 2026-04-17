import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../Models/User.js';

const tokenVerify = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(401, "Unauthorized request")
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select("-password -token -otp -otpExpiry");
    if (!user) {
        throw new ApiError(401, "Unauthorized request")
    }
    req.user = user;
    next();
})

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "Admin") {
        throw new ApiError(403, "Access denied. Admin privileges required.")
    }
    next();
}

export { tokenVerify, adminOnly };
