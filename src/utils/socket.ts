// socket.ts
import http from "http";
import { Server as SocketIoServer } from "socket.io";
import userRabbitMQClient from "../modules/user/rabbitMQ/client";
import "dotenv/config";

export const initSocketServer = (server: http.Server) => {
  const io = new SocketIoServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("user connected");

    socket.on("notification", (data) => {
      io.emit("newNotification", data);
    });

    socket.on("startStream", async (data) => {
      try {
        console.log("Start streaming data", data);

        const userResponse: any = await userRabbitMQClient.produce(
          { id: data.instructorId },
          "get-user"
        );
        const userResult = JSON.parse(userResponse.content.toString());
        io.emit("joinStream", {
          courses: userResult?.courses,
          streamId: data.callid,
        });
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        socket.emit("error", "Failed to start stream due to server error.");
      }
    });
    
    // Handle stream end
    socket.on("endStream", (data) => {
      io.emit("streamEnded", { streamId: data.callid });
    });

    socket.on("sendMessage", (data) => {
      io.emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};