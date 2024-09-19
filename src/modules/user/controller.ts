
import { StatusCode } from "../../interface/enum";
import { Request,Response,NextFunction, response } from "express";
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
            if(!result.success){
                res
                .status(StatusCode.BadRequest)
                .json({ success: false, message: result.message });
              return;
            }
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
            if (!result.success) {
                res
                  .status(StatusCode.BadRequest)
                  .json({ success: false, message: result.message });
                return;
              }    
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
             console.log(result)
             if (!result || !result.accessToken || !result.refreshToken) {
                res
                  .status(StatusCode.BadRequest)
                  .json({ success: false, message: result.message });
                return;
              }        
             const options = generateTokenOptions();
             res.cookie('refreshToken',result?.refreshToken,options.refreshTokenOptions);
             res.cookie('accessToken',result?.accessToken,options.accessTokenOptions);
             res.status(StatusCode.Accepted).json(result);
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:false,message:error})
        }
    }
    logout = (req: Request, res: Response, next: NextFunction) => {
        try {
          res.cookie("accessToken", "", {
            maxAge: 1,
            httpOnly: true,
            sameSite: "none",
            secure: true,
          });
          res.cookie("refreshToken", "", {
            maxAge: 1,
            httpOnly: true,
            sameSite: "none",
            secure: true,
          });
          const cookies = req.cookies;
          for (const cookieName in cookies) {
            res.clearCookie(cookieName);
          }
          res
            .status(StatusCode.Ok)
            .json({ success: true, message: "Logged out successfully" });
        } catch (e: any) {
          next(e);
        }
      };
    
    getUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const token = req.cookies?.accessToken;
    
          if (!token) {
            res
              .status(StatusCode.Unauthorized)
              .json({ success: false, message: "No access token provided." });
            return;
          }
    
          const authResponse: any = await AuthRabbitMQClient.produce(
            { token },
            "is-authenticated"
          );
    
          const authResult = JSON.parse(authResponse.content.toString());
    
          if (!authResult || !authResult.userId) {
            res.status(StatusCode.BadRequest).json({
              success: false,
              message: "User ID not found in authentication result.",
            });
            return;
          }
    
          const userResponse: any = await UserRabbitMQClient.produce(
            { id: authResult.userId },
            "get-user"
          );
    
          const userResult = JSON.parse(userResponse.content.toString());
    
          res.status(StatusCode.Ok).json({ success: true, user: userResult });
        } catch (e: any) {
          res
            .status(StatusCode.InternalServerError)
            .json({ success: false, message: "Internal Server Error" });
    }
   };
    socialAuth = async(req:Request,res:Response,next:NextFunction)=>{
        try {
            const{email,name,avatar} = req.body;
            console.log("req.body",req.body)
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
    updateUserPassword = async (req: CustomRequest, res: Response, next: NextFunction) => {
      try {
          const { oldPassword, newPassword } = req.body;
          const userId = req.userId;
          const operation = 'update-password';
  
          const response: any = await UserRabbitMQClient.produce({ userId, oldPassword, newPassword }, operation);
          const result = JSON.parse(response.content.toString());
  
          if (!result.success) {
              return res.status(StatusCode.BadRequest)
                        .json({ success: false, message: result.message });
          }
          return res.status(StatusCode.Created).json(result);
  
      } catch (error) {
          return res.status(StatusCode.BadGateway).json({ success: false, message: error });
      }
  };
  
  updateUserAvatar = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file;
      const id = req.userId;

      console.log("file",file)
      console.log("id",req.userId)

      const response: any = await UserRabbitMQClient.produce(
        {
          data: file?.buffer,
          fieldname: file?.fieldname,
          mimetype: file?.mimetype,
          id,
        },
        "update-avatar"
      );
      const result = JSON.parse(response.content.toString());
      console.log(result);
      
      if (result.success) {
        res.status(StatusCode.Created).json(result);
      } else {
        res.status(StatusCode.BadRequest).json({ message: "Bad Request" });
      }
    } catch (e: any) {
      next(e);
    }
  };
    forgotPassword = async(req:Request,res:Response,next:NextFunction)=>{
        try {
            const operation = 'forgot-password'
            const response:any = await UserRabbitMQClient.produce(req.body,operation);
            const result = JSON.parse(response.content.toString());
            if (!result.success) {
                res
                  .status(StatusCode.BadRequest)
                  .json({ success: false, message: result.message });
                return;
              }  
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
            if (!result.success) {
                res
                  .status(StatusCode.BadRequest)
                  .json({ success: false, message: result.message });
                return;
              }    
           return res.status(StatusCode.Created).json(result)
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

    getUserAnalytics = async(req:Request,res:Response,next:NextFunction) =>{
      try {
        const operation = "get-user-Analytics"
        const instructorId = req.params.id;
        const response:any = await UserRabbitMQClient.produce(instructorId,operation);
        const result = JSON.parse(response.content.toString());
        res.status(StatusCode.Created).json(result);
      } catch (e:any) {
        res.status(StatusCode.BadGateway).json({success:false})
      }
    }
}