
import 'dotenv/config'

export default{
    rabbitMQ:{
        url:String(process.env.RabbitMQ_Link),
         queues:{
            userQueues:"user_queue",
            authQueue:"auth_queue",
            notificationQueue:"notification_queue",
            instructorQueue:"instructor_queue",
            adminQueue:"admin_queue"
         }
    }
}