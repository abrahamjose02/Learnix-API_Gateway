import { Channel, connect, Connection } from "amqplib";
import Consumer from "./consumer";
import Producer from "./producer";
import EventEmitter from "events";
import rabbiMQConfig from "../../config/rabbiMQ.config";



class RabbitMQClient{
    private constructor(){}
    private static instance:RabbitMQClient;
    private isInitialized = false;
    private producer:Producer | undefined;
    private consumer:Consumer | undefined;
    private connection:Connection | undefined;
    private producerChannel:Channel | undefined;
    private consumerChannel:Channel | undefined;
    private eventEmitter:EventEmitter | undefined;

    public static getInstance(){
        if(!this.instance){
            this.instance = new RabbitMQClient()
        }
        return this.instance
    }

    async initialize(){
        if(this.isInitialized){
            return;
        }
        try {
            this.connection = await connect(rabbiMQConfig.rabbitMQ.url);
            this.producerChannel = await this.connection.createChannel();
            this.consumerChannel = await this.connection.createChannel();

            const{queue:replyQueueName} = await this.consumerChannel.assertQueue("",{exclusive:true});
            this.eventEmitter = new EventEmitter()
            this.producer = new Producer(this.producerChannel,replyQueueName,this.eventEmitter);
            this.consumer = new Consumer(this.consumerChannel,replyQueueName,this.eventEmitter);

            this.consumer.consumeMessages();
            this.isInitialized = true
        } catch (error:any) {
            throw new Error(error)
        }
    }
    async produceMessages(data:any,operation:string){
        if(!this.isInitialized){
            await this.initialize()
        }
        return await this.producer?.produceMessage(data,operation);
    } 
}

export default RabbitMQClient.getInstance();