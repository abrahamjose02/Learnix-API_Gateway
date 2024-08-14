import { Channel } from "amqplib";
import { randomUUID } from "crypto";
import EventEmitter from "events";
import rabbiMQConfig from "../../config/rabbiMQ.config";




export default class Producer{
    constructor(private channel:Channel,private replyQueueName:string,private eventEmitter:EventEmitter){}

    async produceMessage(data:any,operation:string){
        const uuid = randomUUID();
        this.channel.sendToQueue(rabbiMQConfig.rabbitMQ.queues.notificationQueue,Buffer.from(JSON.stringify(data)),{
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