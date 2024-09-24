// socket.ts
import http from "http";
import { Server as SocketIoServer } from "socket.io";
import userRabbitMQClient from "../modules/user/rabbitMQ/client";
import "dotenv/config";

// Define an interface to track users in each stream by callid
interface UsersInStream {
  [callid: string]: string[]; // Array of user names participating in the stream
}

export const initSocketServer = (server: http.Server) => {
  const io = new SocketIoServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Object to store the users in each stream
  const usersInStream: UsersInStream = {};

  io.on("connection", (socket) => {
    console.log("user connected");

    // When a user joins a stream
    socket.on("userJoinedStream", (data) => {
      const { name, callid } = data;

      // If this stream doesn't exist in the object, initialize it
      if (!usersInStream[callid]) {
        usersInStream[callid] = [];
      }

      // Add the user to the stream if they're not already in the list
      if (!usersInStream[callid].includes(name)) {
        usersInStream[callid].push(name);
      }

      // Emit an event to update all clients with the current participants in the stream
      io.emit("updateStreamParticipants", { callid, users: usersInStream[callid] });
    });

    // Start stream logic
    socket.on("startStream", async (data) => {
      try {
        console.log("Start streaming data", data);

        // Fetch instructor information from RabbitMQ
        const userResponse: any = await userRabbitMQClient.produce(
          { id: data.instructorId },
          "get-user"
        );
        const userResult = JSON.parse(userResponse.content.toString());

        // Emit event to inform all users about the stream
        io.emit("joinStream", {
          courses: userResult?.courses,
          streamId: data.callid,
        });
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        socket.emit("error", "Failed to start stream due to server error.");
      }
    });

    // End stream logic
    socket.on("endStream", (data) => {
      // Emit event to inform all users that the stream has ended
      io.emit("streamEnded", { streamId: data.callid });

      // Remove the users associated with the stream from usersInStream object
      delete usersInStream[data.callid];
    });

    // Handle sending messages during the stream
    socket.on("sendMessage", (data) => {
      // Emit event to send message to all clients in the stream
      io.emit("receiveMessage", data);
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
