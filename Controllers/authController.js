import { User } from '../Models/User.js';
import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { sendEmail } from '../utils/sendEmail.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aggregationFunction } from '../utils/aggregateFunction.js';
import { Otp } from '../Models/Otp.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const generateAccessTokenAndRefreshToken = async (user_id) => {
    const user = await User.findById(user_id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.token = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

// User Registration
const userRegisterController = asyncHandler(async (req, res) => {

    const isRegister = req.body.first_name || req.body.name || req.body.username || req.body.phonenumber || req.body.phone;

    if (isRegister) {
        let first_name = req.body.first_name;
        let last_name = req.body.last_name || "";

        if (!first_name && req.body.name) {
            const nameParts = req.body.name.trim().split(" ");
            first_name = nameParts[0];
            last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        }

        const username = req.body.username;
        const password = req.body.password;
        const phonenumber = req.body.phonenumber || req.body.phone;
        const email = req.body.email;
        const role = req.body.role || "Customer";

        let profile = "";
        if (req.file) {
            const cloudinaryResult = await uploadOnCloudinary(req.file, "profile");
            profile = cloudinaryResult ? cloudinaryResult.secure_url : "";
        }

        if (!first_name || !username || !password || !phonenumber || !email) {
            throw new ApiError(400, "All required fields must be provided for registration");
        }

        const checkUser = await User.findOne({ email });
        if (checkUser) {
            throw new ApiError("User already exists with this email");
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const otp_code = Math.floor(1000000 + Math.random() * 9000000);
        const hashOtp = await bcrypt.hash(otp_code.toString(), 10);
        const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await User.create({ first_name, last_name, username, password: hashPassword, phonenumber, email, role, profile });

        await Otp.create({ email, otp: hashOtp, otpExpiry });

        const user = await User.findOne({ email }).select("-password -token");

        const emailSend = await sendEmail(
            email,
            "User Registration Otp",
            `You otp for user registration is ${otp_code}. And Is Valid for 10 minutes`
        )

        return res.status(200).json(
            new ApiResponse({ user, emailSend }, "Otp is send to email for user registration")
        )

    } else {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError("Email and password are required for login");
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError("User not found");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError("Invalid password");
        }

        await user.save();
        const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

        const logUser = await User.findById(user._id)
            .select("-password -token");

        return res.status(200).cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true
        }).cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true
        }).json(
            new ApiResponse({ logUser, accessToken, refreshToken }, "User logged in successfully")
        )
    }
});

const verifyOtpController = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError("User not found");
    }

    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord) {
        throw new ApiError("Otp not found for this email");
    }

    if (otpRecord.otpExpiry < Date.now()) {
        throw new ApiError("otp expiry");
    }

    const matchOtp = await bcrypt.compare(otp.toString(), otpRecord.otp);
    if (!matchOtp) {
        throw new ApiError("Otp is not match");
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    const logUser = await User.findById(user._id)
        .select("-password -token");

    const options = {
        httpOnly: true,
        secure: true
    }
    await Otp.findByIdAndDelete(otpRecord._id);
    return res.status(200).cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options).json(
            new ApiResponse({ logUser, accessToken, refreshToken }, "Otp verified successfully")
        )
});

const forgetPasswordController = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError("User not found")
    }

    const otp_code = Math.floor(100000 + Math.random() * 900000);
    const hashOtp = await bcrypt.hash(otp_code.toString(), 10);
    const expirtyOtp = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({ email, otp: hashOtp, otpExpiry: expirtyOtp });

    const emailSend = await sendEmail(
        email,
        "Password Reset Otp",
        `You otp for password resent OTP is ${otp_code}. And Is Valid for 10 minutes`
    )

    return res.status(200).json(
        new ApiResponse({ emailSend }, "Otp is send to email for forget password")
    )
});

const resetPasswordController = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError("User not found")
    }

    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord) {
        throw new ApiError("Otp not found for this email");
    }

    if (otpRecord.otpExpiry < Date.now()) {
        throw new ApiError("otp expiry")
    }

    const matchOtp = await bcrypt.compare(otp.toString(), otpRecord.otp);
    console.log(matchOtp);
    if (!matchOtp) {
        throw new ApiError("Otp is not match")
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    await Otp.findByIdAndDelete(otpRecord._id);

    return res.status(200).json(
        new ApiResponse(user, "Password reset successfully")
    )
});

const getAllUser = asyncHandler(async (req, res) => {
    const user_pipline = await aggregationFunction(User, req.query, {
        searchFild: ["first_name", "last_name", "username", "email", "phonenumber"],
        sortFild: "username",
        sortType: req.query.sortType || "a-z",
        filter: {},
        project: {
            password: 0,
            token: 0
        }
    })

    // const user = await User.aggregate(user_pipline);

    return res.status(200).json(
        new ApiResponse(user_pipline, "User fetched successfully")
    )
});

const updateUserController = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const user = await User.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
    }).select("-password -token -otp -otpExpiry");

    return res.status(200).json(
        new ApiResponse(user, "User updated successfully")
    )

});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { is_deactive: true, is_active: false }, {
        new: true,
        runValidators: true
    }).select("-password -token -otp -otpExpiry");
    return res.status(200).json(
        new ApiResponse(user, "User deleted successfully")
    )
});

const getUserProfileController = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(req.user, "User profile fetched successfully")
    )
});

const updateUserProfileController = asyncHandler(async (req, res) => {
    const updateData = { ...req.body };
    if (req.file) {
        const cloudinaryResult = await uploadOnCloudinary(req.file, "profile");
        if (cloudinaryResult) {
            updateData.profile = cloudinaryResult.secure_url;
        }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
        runValidators: true
    }).select("-password -token -otp -otpExpiry");

    return res.status(200).json(
        new ApiResponse(user, "User profile updated successfully")
    )
});

export {
    userRegisterController,
    verifyOtpController,
    forgetPasswordController,
    resetPasswordController,
    updateUserController,
    deleteUser,
    getAllUser,
    getUserProfileController,
    updateUserProfileController
}
