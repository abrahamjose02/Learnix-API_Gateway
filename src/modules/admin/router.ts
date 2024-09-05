import express,{Application} from "express"
import AdminController from "./controller";
import { isValidated } from "../auth/controller";

const adminRoute: Application = express();
const controller = new AdminController();

adminRoute.get("/get-users", isValidated, controller.getAllUsers);
adminRoute.get("/get-instructors", isValidated, controller.getAllInstructors);
adminRoute.delete("/delete-user/:id", isValidated, controller.deleteUser);
adminRoute.get("/get-instructor/:id", isValidated, controller.getInstructorData);
adminRoute.patch("/verify-instructor/:id", isValidated, controller.verifyInstructor);
adminRoute.patch('/block-user/:id',isValidated,controller.blockUser);
adminRoute.patch('/unBlock-user/:id',isValidated,controller.unBlockUser);
adminRoute.post('/add-faq',isValidated,controller.addFAQ);
adminRoute.get('/get-faq',controller.getFAQ);
adminRoute.post('/add-categories',isValidated,controller.addCategories);
adminRoute.get('/get-categories',controller.getCategories);


export default adminRoute;