// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server,{
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.use(cors());

let users = {}; // Store users with their socket IDs

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // Store the connected user's socket ID and user ID
  socket.on("join-room", (userID) => {
    users[userID] = socket.id;
    console.log(`User ${userID} joined the room`);
    io.emit("user-list", Object.keys(users)); // Send the updated user list to all clients
  });

  // Handle individual user calls
  socket.on("call", (toUserID) => {
    const toSocketID = users[toUserID];
    if (toSocketID) {
      socket.to(toSocketID).emit("incoming-call", socket.id); // Notify the called user
    }
  });

  // Handle offer
  socket.on("offer", (data) => {
    io.to(data.to).emit("offer", data.offer);
  });

  // Handle answer
  socket.on("answer", (answer) => {
    socket.broadcast.emit("answer", answer);
  });

  // Handle ICE candidates
  socket.on("ice-candidate", (candidate) => {
    socket.broadcast.emit("ice-candidate", candidate);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
    for (const userID in users) {
      if (users[userID] === socket.id) {
        delete users[userID];
        io.emit("user-list", Object.keys(users)); // Update the user list
        break;
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
