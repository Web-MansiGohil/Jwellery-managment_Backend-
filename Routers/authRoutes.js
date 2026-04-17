import express from 'express';
import { deleteUser, forgetPasswordController, getAllUser, resetPasswordController, updateUserController, userRegisterController, verifyOtpController, getUserProfileController, updateUserProfileController } from '../controllers/authController.js';
import { adminOnly, tokenVerify } from '../Middleware/authMiddleware.js';
import { upload } from '../Middleware/multerMidleware.js';



const router = express.Router();
// @route  
// desc : user register and login 
// method: POST 
// endpoint:/api/users/auth
router.post('/users/auth', upload.single('profile'), userRegisterController);

//@route
//desc : verifyotp
//method: POST
// endpoint : /api/users/verify-otp
router.post("/users/verify-otp", verifyOtpController);

//@route
//desc : forget password
//method: POST
// endpoint : /api/users/forget-password
router.post("/users/forget-password", forgetPasswordController);
//@route
//desc : get all user
//method: GET
// endpoint : /api/users/

router.get("/users/", getAllUser);

//@route
//desc : get user profile
//method: GET
// endpoint : /api/users/profile
router.get("/users/profile", tokenVerify, getUserProfileController);

//@route
//desc : update user profile
//method: PUT
// endpoint : /api/users/profile/update
router.put("/users/profile/update", tokenVerify, upload.single('profile'), updateUserProfileController);

//@route
//desc : reset password
//method: POST
// endpoint : /api/users/reset-password
router.post("/users/reset-password", resetPasswordController);

//@route
//desc : updates user
//method: POST
// endpoint : /api/users/update/:id
router.put("/users/update/:id", tokenVerify, adminOnly, updateUserController);

//@route
//desc : delete user
//method: POST
// endpoint : /api/users/delete/:id
router.delete("/users/delete/:id", tokenVerify, adminOnly, deleteUser);

export default router;
