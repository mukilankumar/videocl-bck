const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// Store users with their socket IDs
let users = {};

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle user joining
  socket.on("join-room", (userID) => {
    users[userID] = socket.id;
    console.log(`User ${userID} joined with socket ${socket.id}`);
    io.emit("user-list", Object.keys(users));
  });

  // Handle incoming call
  socket.on("incoming-call", ({ to }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      socket.to(toSocketId).emit("incoming-call", {
        from: Object.keys(users).find(key => users[key] === socket.id)
      });
    }
  });

  // Handle offer
  socket.on("offer", ({ offer, to, from }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      socket.to(toSocketId).emit("offer", {
        offer,
        from
      });
    }
  });

  // Handle answer
  socket.on("answer", ({ answer, to, from }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      socket.to(toSocketId).emit("answer", {
        answer,
        from
      });
    }
  });

  // Handle ICE candidate
  socket.on("ice-candidate", ({ candidate, to }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      socket.to(toSocketId).emit("ice-candidate", {
        candidate,
        from: Object.keys(users).find(key => users[key] === socket.id)
      });
    }
  });

  // Handle call rejection
  socket.on("reject-call", ({ to }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      socket.to(toSocketId).emit("call-rejected");
    }
  });

  // Handle call end
  socket.on("end-call", ({ to }) => {
    const toSocketId = users[to];
    if (toSocketId) {
      socket.to(toSocketId).emit("call-ended");
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const userID = Object.keys(users).find(key => users[key] === socket.id);
    if (userID) {
      console.log(`User ${userID} disconnected`);
      delete users[userID];
      io.emit("user-list", Object.keys(users));
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
