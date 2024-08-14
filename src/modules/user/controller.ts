
import { StatusCode } from "../../interface/enum";
import { Request,Response,NextFunction } from "express";
import UserRabbitMQClient from './rabbitMQ/client';
import { generateTokenOptions } from "../../utils/generateTokenOptions";
import AuthRabbitMQClient from '../auth/rabbitMQ/client';
import { CustomRequest } from "../interfaces/IRequest";

export default class UserController{
    register = async(req:Request,res:Response,next:NextFunction)=>{
        
        try {
            const operation = "register";
            console.log('Request body',req.body);
            console.log(operation);
            const response:any = await UserRabbitMQClient.produce(req.body,operation);
            const result = JSON.parse(response.content.toString());
            res.status(StatusCode.Created).json(result);
        } catch (error) {
            res.status(StatusCode.BadGateway).json({message:error})
        }
    }
    activate = async(req:Request,res:Response,next:NextFunction)=>{
        try {
            const operation = "activate"
            console.log('Request body',req.body)
            const response:any = await UserRabbitMQClient.produce(req.body,operation);
            const result = JSON.parse(response.content.toString());
            res.status(StatusCode.Accepted).json(result)
        } catch (error) {
            res.status(StatusCode.BadGateway).json({message:error})
        }
    }
    login = async(req:Request,res:Response,next:NextFunction)=>{
        try {
             const operation = "login";
             const response:any = await UserRabbitMQClient.produce(req.body,operation)
             const result = JSON.parse(response.content.toString());
             const options = generateTokenOptions();
             res.cookie('refreshToken',result?.refreshToken,options.refreshTokenOptions);
             res.cookie('accessToken',result?.accessToken,options.accessTokenOptions);
             res.status(StatusCode.Accepted).json(result);
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
    logout = async(req:Request,res:Response,next:NextFunction)=>{
        try {
            res.cookie("accessToken","",{maxAge:1});
            res.cookie("refreshToken","",{maxAge:1});
            const cookies = req.cookies;
            for(let cookieName in cookies){
                res.clearCookie(cookieName)
            }
            res.status(StatusCode.Ok).json({success:true,message:"Logged out successfully"})
        } catch (error:any) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
    getUser = async(req:Request,res:Response,next:NextFunction)=>{
        try {
            const authOperation = 'is-authenticated';
            const authResponse:any = await AuthRabbitMQClient.produce(
                {token:req.cookies?.accessToken},authOperation
            );
            const authResult = JSON.parse(authResponse.content.toString());
            const userId = authResult.userId

            const userOperation = 'get-user';
            const userResponse:any = await UserRabbitMQClient.produce({id:userId},userOperation);
            const userResult = JSON.parse(userResponse.content.toString());
            
            res.status(StatusCode.Ok).json({user:userResult});
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
    socialAuth = async(req:Request,res:Response,next:NextFunction)=>{
        try {
            const{email,name,avatar} = req.body;
            const operation = 'social-auth';
            const response:any = await UserRabbitMQClient.produce({name,email,avatar},operation);
            const result = JSON.parse(response.content.toString());
            const options = generateTokenOptions();
            res.cookie('accessToken',result.accessToken,options.accessTokenOptions);
            res.cookie('refreshToken',result.refreshToken,options.refreshTokenOptions);
            res.status(StatusCode.Accepted).json(result);
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
    updateUserInfo = async(req:CustomRequest,res:Response,next:NextFunction)=>{
        try {
            const{name} = req.body;
            const userId = req.userId;
            const operation = 'update-user-info';
            const response:any = await UserRabbitMQClient.produce({name,userId},operation);
            const result = JSON.parse(response.content.toString());
            res.status(StatusCode.Created).json(result);
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
    updateUserPassword = async(req:CustomRequest,res:Response,next:NextFunction)=>{
        try {
            const{oldPassword,newPassword} = req.body;
            const userId = req.userId
            const operation = 'update-password';
            const response:any = await UserRabbitMQClient.produce({userId,oldPassword,newPassword},operation);
            const result = JSON.parse(response.content.toString());
            res.status(StatusCode.Created).json(result);
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
    updateUserAvatar = async(req:CustomRequest,res:Response,next:NextFunction)=>{
        try {
            const file = req.file;
            const id = req.userId;
            const operation = 'update-avatar'
            const response:any = await UserRabbitMQClient.produce({
                data:file?.buffer,
                filename:file?.fieldname,
                mimetype:file?.mimetype,
                id,
            },operation)

            const result = JSON.parse(response.content.toString())
            res.status(StatusCode.Created).json(result);
            
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
    forgotPassword = async(req:Request,res:Response,next:NextFunction)=>{
        try {
            const operation = 'forgot-password'
            const response:any = await UserRabbitMQClient.produce(req.body,operation);
            const result = JSON.parse(response.content.toString());
            res.status(StatusCode.Created).json(result);
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
    verifyResetCode = async(req:Request,res:Response,next:NextFunction)=>{
        try {
            const operation = "verify-reset-code"
            const response:any = await UserRabbitMQClient.produce(req.body,operation);
            const result = JSON.parse(response.content.toString());
            res.status(StatusCode.Created).json(result)
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
    resetPassword = async(req:Request,res:Response,next:NextFunction)=>{
        try {
            const operation = "reset-password"
            const response:any = await UserRabbitMQClient.produce(req.body,operation);
            const result = JSON.parse(response.content.toString());
            res.status(StatusCode.Created).json(result)
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
}