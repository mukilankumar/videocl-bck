// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Store connected users
const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (userID) => {
    users[userID] = socket.id;
    console.log("User joined:", userID);
    io.emit("user-list", Object.keys(users));
  });

  socket.on("offer", ({ offer, to, from }) => {
    console.log(`Sending offer from ${from} to ${to}`);
    const toSocketId = users[to];
    if (toSocketId) {
      io.to(toSocketId).emit("offer", { offer, from });
    }
  });

  socket.on("answer", ({ answer, to, from }) => {
    console.log(`Sending answer from ${from} to ${to}`);
    const toSocketId = users[to];
    if (toSocketId) {
      io.to(toSocketId).emit("answer", { answer, from });
    }
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      io.to(toSocketId).emit("ice-candidate", {
        candidate,
        from: Object.keys(users).find(key => users[key] === socket.id)
      });
    }
  });

  socket.on("disconnect", () => {
    const userID = Object.keys(users).find(key => users[key] === socket.id);
    if (userID) {
      console.log("User disconnected:", userID);
      delete users[userID];
      io.emit("user-list", Object.keys(users));
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
