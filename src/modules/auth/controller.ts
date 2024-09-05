import { Request,Response,NextFunction } from "express";
import { CustomRequest } from "../interfaces/IRequest";
import { UserRole } from "../../utils/user.entities";
import { StatusCode } from "../../interface/enum";
import AuthRabbitMQClient from './rabbitMQ/client';
import AsyncHanlder from "express-async-handler";
import { generateTokenOptions } from "../../utils/generateTokenOptions";
import UserRabbitMQClient from '../user/rabbitMQ/client'

export const isValidated = AsyncHanlder(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const token = req.cookies?.accessToken;
  
      try {
        const response: any = await AuthRabbitMQClient.produce(
          { token },
          "is-authenticated"
        );
        const result = JSON.parse(response.content.toString());
  
        if (!result || !result.userId) {
          res
            .status(StatusCode.Unauthorized)
            .json({ success: false, message: "Unauthorized" });
          return;
        }
  
        const operation = "get-user";
        const id = result.userId;
        const userResponse: any = await UserRabbitMQClient.produce(
          { id },
          operation
        );
        const user = JSON.parse(userResponse.content.toString());
        if (user.isBlocked) {
          
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
  
          res
            .status(StatusCode.Forbidden)
            .json({ success: false, message: "User is blocked and logged out!" });
          return;
        }
        req.userId = result.userId;
        req.role = result.role;
        next();
      } catch (err: any) {
        res
          .status(StatusCode.Unauthorized)
          .json({ success: false, message: err.message });
   }
 }
  );
  

export const authorizeRoles = (...roles:UserRole[])=>{
    return AsyncHanlder(
        async(req:CustomRequest,res:Response,next:NextFunction):Promise<any>=>{
            try {
                if(req.role && Object.values(UserRole).includes(req.role as UserRole)){
                    if(!roles.includes(req.role as UserRole)){
                        return res.status(StatusCode.NotAccepted).json({success:false,message:`Role: ${req.role} is not allowed to access this resource`})
                    }
                    else{
                        return res.status(StatusCode.NotAccepted).json({success:false,message:'Invalid role provider'})
                    }
                    
                };
                next()
            } catch (error) {
                res.status(StatusCode.BadGateway).json({success:false,message:error})
            }
        }
    )
}

export const refreshToken = AsyncHanlder(
    async(req:CustomRequest,res:Response,next:NextFunction):Promise<any>=>{
        try {
            const token = req.cookies.refreshToken;
            if(!token){
                return res.status(StatusCode.Unauthorized).json({success:false,message:'Token is missing'});
            }
            const operation = 'refresh-token';
            const response:any = await AuthRabbitMQClient.produce({token},operation);
            const result = JSON.parse(response.content.toString());
            // if(req.role !== 'admin'){
            //     const userOperation = 'get-user';
            // const userResponse: any = await UserRabbitMQClient.produce({ userId: result.userId }, userOperation);
            // const userResult = JSON.parse(userResponse.content.toString());
            // if (userResult.isBlocked) {
            //     return res.status(StatusCode.Forbidden).json({ success: false, message: "User is blocked" });
            // }
            // }
            const options = generateTokenOptions()
            res.cookie('accessToken',result.accessToken,options.accessTokenOptions);
            res.cookie('refreshToken',result.refreshToken,options.refreshTokenOptions);
            res.status(StatusCode.Created).json({success:true,message:'New Token generated successfully'});
        } catch (error) {
            res.status(StatusCode.BadGateway).json({success:true,message:error})
        }
    }
)