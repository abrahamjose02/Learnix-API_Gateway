import { Channel } from "amqplib";
import { randomUUID } from "crypto";
import rabbiMQConfig from "../../../config/rabbiMQ.config";
import EventEmitter from "events";

export default class Producer{
    constructor(private channel:Channel,private replyQueueName:string,private eventEmitter:EventEmitter){}

    async produceMessages(data:any,operation:string){
        const uuid = randomUUID();
        this.channel.sendToQueue(rabbiMQConfig.rabbitMQ.queues.authQueue,Buffer.from(JSON.stringify(data)),{
            replyTo:this.replyQueueName,
            correlationId:uuid,
            expiration:10,
            headers:{function:operation}
        });

        return new Promise((resolve,reject)=>{
            this.eventEmitter.once(uuid,async(data)=>{
                resolve(data);
            })
        })
    }

}