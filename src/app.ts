import { Application } from "express";
import http from 'http';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import 'dotenv/config';
import userRoute from "./modules/user/route";
import authRoute from "./modules/auth/route";

class App{
    public app:Application | any;
    server: http.Server<typeof http.IncomingMessage , typeof http.ServerResponse>;

    constructor(){
        this.app = express();
        this.server = http.createServer(this.app);
        this.applyMiddleware();
        this.routes();
    }

    private applyMiddleware():void{
        this.app.use(express.json());
        this.app.use(
            cors({
                origin:process.env.CORS_ORIGIN,
                credentials:true,
            })
        );
        this.app.use(compression());
        this.app.use(cookieParser());

    }

    private routes():void{
        this.app.use('/api/user',userRoute);
        this.app.use('/api/auth',authRoute);
    }

    public startServer(port:number):void{
        this.server.listen(port,()=>{
            console.log(`API-Gateway started on ${port}`)
        });
    }
}

export default App;