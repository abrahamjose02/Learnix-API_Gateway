import express,{Application } from "express";
import UserController from "./controller";
import { isValidated } from "../auth/controller";
import multer from "multer";

const storage = multer.memoryStorage()
const upload = multer({storage})

const userRoute:Application = express();
const controller = new UserController();


userRoute.post('/register',controller.register);
userRoute.post('/activate',controller.activate);
userRoute.post('/login',controller.login);
userRoute.get('/me',isValidated,controller.getUser);
userRoute.post('/social-auth',controller.socialAuth);
userRoute.post('/logout',controller.logout);
userRoute.patch('/update-user-info',isValidated,controller.updateUserInfo);
userRoute.patch('/update-user-password',isValidated,controller.updateUserPassword);
userRoute.post('/update-user-avatar', isValidated, upload.single('avatar'), controller.updateUserAvatar)
userRoute.post('/forgot-password',controller.forgotPassword);
userRoute.post('/verify-reset-code',controller.verifyResetCode);
userRoute.post('/reset-password',controller.resetPassword)
userRoute.get('/get-users-analytics/:id',isValidated,controller.getUserAnalytics);

export default userRoute;