import { NextFunction,Response } from "express";
import { CustomRequest } from "../interfaces/IRequest";
import AdminRabbitMQClient from './config/client';
import "dotenv/config";
import { StatusCode } from "../../interface/enum"
import { retryAndBreakerOperation } from "../../retry-handler/retryWithCircuitBreaker";

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
        res.status(StatusCode.Ok).json(JSON.parse(response.content.toString()));
    } catch (e:any) {
        res.status(StatusCode.BadRequest).json({message:e})
    }
  }
}