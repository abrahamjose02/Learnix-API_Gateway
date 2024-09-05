import { NextFunction,Response } from "express";
import { CustomRequest } from "../interfaces/IRequest";
import AdminRabbitMQClient from './config/client';
import "dotenv/config";
import { StatusCode } from "../../interface/enum"
import { retryAndBreakerOperation } from "../../retry-handler/retryWithCircuitBreaker";
import InstructorRabbitMQClient from '../instructor/rabbitMQ/client'
import UserRabbitMQClient from '../user/rabbitMQ/client';

export interface S3Params {
  Bucket: string;
  Key: string;
  Body: Buffer | undefined;
  ContentType: string | undefined;
}

export default class AdminController {
  getAllUsers = async(req:CustomRequest,res:Response,next:NextFunction)=>{
    try {
        const operation = 'get-all-users';
        const response:any = await retryAndBreakerOperation(()=>AdminRabbitMQClient.produce(null,operation));
        res.status(StatusCode.Ok).json(JSON.parse(response.content.toString()));
    } catch (e:any) {
        res.status(StatusCode.BadRequest).json({ message: e });
    }
  }
  getAllInstructors = async(req:CustomRequest,res:Response,next:NextFunction)=>{
    try {
        const operation = 'get-all-instructors';
        const response:any = await AdminRabbitMQClient.produce(null,operation);
        const result = JSON.parse(response.content.toString());
        res.status(StatusCode.Ok).json(result);
    } catch (e:any) {
        res.status(StatusCode.BadRequest).json({message:e})
    }
  }
  getInstructorData = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "get-user";
      const { id } = req.params;
      const response: any = await UserRabbitMQClient.produce(
        { id: id },
        operation
      );
      const user = JSON.parse(response.content.toString());
      console.log("userData", user);

      const instructorOperation = "get-instructor";

      const instructorResponse: any = await InstructorRabbitMQClient.produce(
        { id: id },
        instructorOperation
      );

      console.log("instructorData", user.name, instructorResponse);
      res.json({
        user,
        instructorResponse,
      });
    } catch (e: any) {
      next(e);
}
};


  verifyInstructor = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const {id} = req.params;
      console.log("req.params",req.params.id);
      const operation = 'verify-instructor';
      const response: any = await UserRabbitMQClient.produce({id},operation);
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.Ok).json(result);
    } catch (e: any) {
      res.status(StatusCode.BadRequest).json({ message: e.message });
    }
  };

  deleteUser = async(req:CustomRequest,res:Response,next:NextFunction) =>{
    try {
      const operation = "delete-user";
      console.log("req.params.id",req.params)
      const userId = req.params.id;
      const response:any = await AdminRabbitMQClient.produce(
        userId,
        operation
      );
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.Ok).json(result)
    } catch (e:any) {
      res.status(StatusCode.BadGateway).json({message:e})
    }
  }

  blockUser = async(req:CustomRequest,res:Response,next:NextFunction) =>{
    try {
      const {id} = req.params;
      console.log("req.params",req.params.id)
      const operation = 'block-user';
      const response:any = await UserRabbitMQClient.produce({id},operation);
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.Ok).json(result)
    } catch (e:any) {
      res.status(StatusCode.BadGateway).json({message:e})
    }
  }
  unBlockUser = async(req:CustomRequest,res:Response,next:NextFunction) =>{
    try {
      const {id} = req.params;
      console.log("req.params",req.params.id)
      const operation = 'unBlock-user';
      const response:any = await UserRabbitMQClient.produce({id},operation);
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.Ok).json(result)
    } catch (e:any) {
      res.status(StatusCode.BadGateway).json({message:e});
    }

  }
  addFAQ = async(req:CustomRequest,res:Response,next:NextFunction) =>{
    try {
      const operation = 'add-faq';
      const questions = req.body;
      const response:any = await AdminRabbitMQClient.produce(questions,operation);
      const result = JSON.parse(response.content.toString())
      res.status(StatusCode.Ok).json(result)
    } catch (e:any) {
      next(e)
    }
  }
  getFAQ = async(req:CustomRequest,res:Response,next:NextFunction) =>{
    try {
      const operation = 'get-faq';
      const response:any = await AdminRabbitMQClient.produce(null,operation);
      const result = JSON.parse(response.content.toString());
      console.log(result)
      res.status(StatusCode.Ok).json(result);
    } catch (e:any) {
      next(e)
    }
  }
  addCategories = async(req:CustomRequest,res:Response,next:NextFunction) =>{
    try {
     const operation = 'add-categories';
     const categories = req.body;
     const response:any = await AdminRabbitMQClient.produce(categories,operation);
    const result = JSON.parse(response.content.toString());
    res.status(StatusCode.Ok).json(result);
    } catch (e:any) {
      next(e)
    }
  }
  getCategories = async(req:CustomRequest,res:Response,next:NextFunction) => {
    try {
      const operation = 'get-categories';
      const response:any = await AdminRabbitMQClient.produce(null,operation);
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.Ok).json(result);
    } catch (e:any) {
      next(e)
    }
  }
}