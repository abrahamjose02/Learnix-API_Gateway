import { Application } from "express";
import http from 'http';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import 'dotenv/config';
import userRoute from "./modules/user/route";
import authRoute from "./modules/auth/route";
import adminRoute from "./modules/admin/router";
import instructorRoute from "./modules/instructor/route";
import courseRoute from "./modules/course/route";
import orderRoute from "./modules/order/route";
import { initSocketServer } from "./utils/socket";
import InstructorRabbitMQClient from './modules/instructor/rabbitMQ/client'

class App{
    public app:Application | any;
    server: http.Server<typeof http.IncomingMessage , typeof http.ServerResponse>;

    constructor(){
        this.app = express();
        this.server = http.createServer(this.app);
        initSocketServer(this.server);
        this.applyMiddleware();
        this.routes();
        InstructorRabbitMQClient.initialize();
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
        this.app.use('/api/admin',adminRoute);
        this.app.use('/api/instructor',instructorRoute);
        this.app.use('/api/courses',courseRoute);
        this.app.use('/api/order',orderRoute);
    }

    public startServer(port:number):void{
        this.server.listen(port,()=>{
            console.log(`API-Gateway started on ${port}`)
        });
    }
}

export default App;