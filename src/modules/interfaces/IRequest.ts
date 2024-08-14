
import { Request } from "express";

export interface CustomRequest extends Request{
    [x: string]: any;
    role?:string,
    userId?:string,
}