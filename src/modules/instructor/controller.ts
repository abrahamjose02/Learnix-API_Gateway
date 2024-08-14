import { NextFunction, Response } from "express";
import { CustomRequest } from "../interfaces/IRequest";
import InstructorRabbitMQClient from "./rabbitMQ/client";
import "dotenv/config";
import { StatusCode } from "../../interface/enum";

export default class instructorController {
  register = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body;
      const file = req.file;
      const operation = "register-instructor";
      const data = {
        userId: req.userId,
        degree: body.degree.join(""),
        institution: body.institution,
        subject: body.subject,
        yearOfCompletion: body.yearOfCompletion,
        certificateName: body.certificateName,
        certificateDate: body.date,
        buffer: file?.buffer,
        fieldName: file?.fieldname,
        mimeType: file?.mimetype,
      };
      const response: any = await InstructorRabbitMQClient.produce(
        data,
        operation
      );
      const user = {
        avatar: response.avatar,
        name: response.name,
        email: response.email,
        isVerified: response.isVerified,
        role: "instructor",
      };
      res.status(StatusCode.Created).json(user);
    } catch (e: any) {
      next(e);
    }
  };
}